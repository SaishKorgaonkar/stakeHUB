// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./HUBToken.sol";

/**
 * @title Arena
 * @notice Parimutuel staking contract for social outcome predictions
 * @dev State machine: OPEN → LOCKED → RESOLVED/CANCELLED
 */
contract Arena {
    enum State { OPEN, LOCKED, RESOLVED, CANCELLED }
    
    struct Outcome {
        string label;
        uint256 totalStaked;
    }
    
    // Immutable configuration
    address public immutable factory;
    address public immutable creator;
    HUBToken public immutable hubToken;
    string public ipfsCid;
    uint256 public immutable deadline;
    uint256 public immutable emergencyDeadline; // 7 days after deadline
    
    // State
    State public state;
    Outcome[] public outcomes;
    uint256 public totalPool;
    uint8 public winningOutcome;
    
    // Mappings
    mapping(address => mapping(uint8 => uint256)) public stakes; // user → outcome → amount
    mapping(address => uint256) public winnings;
    
    // Events
    event StakePlaced(address indexed staker, uint8 outcomeIndex, uint256 amount, uint256 timestamp);
    event ArenaLocked(uint256 timestamp);
    event ArenaResolved(uint8 winningOutcome, uint256 timestamp);
    event ArenaCancelled(uint256 timestamp);
    event WinningsClaimed(address indexed winner, uint256 amount);
    event RefundClaimed(address indexed staker, uint256 amount);
    
    // Constants
    uint256 private constant PROTOCOL_FEE_STANDARD = 200; // 2%
    uint256 private constant PROTOCOL_FEE_DISCOUNTED = 100; // 1%
    uint256 private constant FEE_DENOMINATOR = 10000;
    
    constructor(
        address _creator,
        address _hubToken,
        string memory _ipfsCid,
        string[] memory _outcomeLabels,
        uint256 _deadline
    ) {
        require(_outcomeLabels.length >= 2, "Need at least 2 outcomes");
        require(_deadline > block.timestamp, "Deadline must be future");
        
        factory = msg.sender;
        creator = _creator;
        hubToken = HUBToken(_hubToken);
        ipfsCid = _ipfsCid;
        deadline = _deadline;
        emergencyDeadline = _deadline + 7 days;
        state = State.OPEN;
        
        for (uint i = 0; i < _outcomeLabels.length; i++) {
            outcomes.push(Outcome({
                label: _outcomeLabels[i],
                totalStaked: 0
            }));
        }
    }
    
    /**
     * @notice Stake MON on an outcome
     * @param outcomeIndex Index of the outcome to stake on
     */
    function stake(uint8 outcomeIndex) external payable {
        require(state == State.OPEN, "Arena not open");
        require(block.timestamp < deadline, "Deadline passed");
        require(outcomeIndex < outcomes.length, "Invalid outcome");
        require(msg.value > 0, "Must stake non-zero amount");
        
        stakes[msg.sender][outcomeIndex] += msg.value;
        outcomes[outcomeIndex].totalStaked += msg.value;
        totalPool += msg.value;
        
        emit StakePlaced(msg.sender, outcomeIndex, msg.value, block.timestamp);
    }
    
    /**
     * @notice Lock the arena (creator only, before deadline)
     */
    function lockArena() external {
        require(msg.sender == creator, "Only creator");
        require(state == State.OPEN, "Already locked");
        require(block.timestamp < deadline, "Past deadline");
        
        state = State.LOCKED;
        emit ArenaLocked(block.timestamp);
    }
    
    /**
     * @notice Resolve arena with winning outcome (creator only)
     * @param _winningOutcome Index of the winning outcome
     */
    function resolve(uint8 _winningOutcome) external {
        require(msg.sender == creator, "Only creator");
        require(state == State.LOCKED || (state == State.OPEN && block.timestamp >= deadline), "Cannot resolve");
        require(block.timestamp < emergencyDeadline, "Emergency period active");
        require(_winningOutcome < outcomes.length, "Invalid outcome");
        
        if (state == State.OPEN) {
            state = State.LOCKED;
        }
        
        state = State.RESOLVED;
        winningOutcome = _winningOutcome;
        
        // Calculate parimutuel payouts
        _calculatePayouts(_winningOutcome);
        
        emit ArenaResolved(_winningOutcome, block.timestamp);
    }
    
    /**
     * @notice Emergency cancel if not resolved within 7 days (anyone can call)
     */
    function emergencyCancel() external {
        require(state == State.LOCKED, "Must be locked");
        require(block.timestamp >= emergencyDeadline, "Emergency period not reached");
        
        state = State.CANCELLED;
        emit ArenaCancelled(block.timestamp);
    }
    
    /**
     * @notice Claim winnings after resolution
     */
    function claim() external {
        require(state == State.RESOLVED, "Not resolved");
        uint256 amount = winnings[msg.sender];
        require(amount > 0, "No winnings");
        
        winnings[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit WinningsClaimed(msg.sender, amount);
    }
    
    /**
     * @notice Claim refund if arena cancelled
     */
    function refund() external {
        require(state == State.CANCELLED, "Not cancelled");
        
        uint256 totalRefund = 0;
        for (uint8 i = 0; i < outcomes.length; i++) {
            uint256 staked = stakes[msg.sender][i];
            if (staked > 0) {
                totalRefund += staked;
                stakes[msg.sender][i] = 0;
            }
        }
        
        require(totalRefund > 0, "No refund available");
        
        (bool success, ) = msg.sender.call{value: totalRefund}("");
        require(success, "Transfer failed");
        
        emit RefundClaimed(msg.sender, totalRefund);
    }
    
    /**
     * @dev Calculate parimutuel payouts with protocol fee
     */
    function _calculatePayouts(uint8 _winningOutcome) private {
        uint256 winningPool = outcomes[_winningOutcome].totalStaked;
        if (winningPool == 0) return; // No winners
        
        uint256 losingPool = totalPool - winningPool;
        if (losingPool == 0) {
            // Only winning bets - return stakes
            // Winnings calculation happens per-user on claim
            return;
        }
        
        // Calculate protocol fee
        address treasury = IArenaFactory(factory).treasury();
        uint256 feeRate = hubToken.hasFeeDiscount(creator) ? PROTOCOL_FEE_DISCOUNTED : PROTOCOL_FEE_STANDARD;
        uint256 protocolFee = (losingPool * feeRate) / FEE_DENOMINATOR;
        uint256 prizePool = losingPool - protocolFee;
        
        // Send protocol fee
        if (protocolFee > 0) {
            (bool success, ) = treasury.call{value: protocolFee}("");
            require(success, "Fee transfer failed");
        }
        
        // Calculate individual winnings (lazy - calculated on claim)
        // Formula: winnings[user] = stake[user] * (1 + prizePool / winningPool)
    }
    
    /**
     * @notice Calculate unclaimed winnings for an address
     * @param staker Address to check
     * @return Amount of claimable winnings
     */
    function calculateWinnings(address staker) external view returns (uint256) {
        if (state != State.RESOLVED) return 0;
        
        uint256 userStake = stakes[staker][winningOutcome];
        if (userStake == 0) return 0;
        
        uint256 winningPool = outcomes[winningOutcome].totalStaked;
        uint256 losingPool = totalPool - winningPool;
        
        if (losingPool == 0) {
            // Only winning bets - return stake
            return userStake;
        }
        
        // Calculate fee
        uint256 feeRate = hubToken.hasFeeDiscount(creator) ? PROTOCOL_FEE_DISCOUNTED : PROTOCOL_FEE_STANDARD;
        uint256 protocolFee = (losingPool * feeRate) / FEE_DENOMINATOR;
        uint256 prizePool = losingPool - protocolFee;
        
        // Proportional share of prize pool + original stake
        uint256 prizeShare = (userStake * prizePool) / winningPool;
        return userStake + prizeShare;
    }
    
    /**
     * @notice Get current odds for an outcome
     * @param outcomeIndex Outcome to check
     * @return Implied multiplier (scaled by 100, e.g., 158 = 1.58x)
     */
    function getOdds(uint8 outcomeIndex) external view returns (uint256) {
        if (totalPool == 0) return 100; // 1x if no stakes
        uint256 outcomePool = outcomes[outcomeIndex].totalStaked;
        if (outcomePool == 0) return 0;
        
        return (totalPool * 100) / outcomePool;
    }
}

interface IArenaFactory {
    function treasury() external view returns (address);
}
