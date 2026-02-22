// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HUBToken
 * @notice Governance token providing fee discounts in StakeHub
 * @dev Holding >= 1000 HUB reduces platform fee from 2% to 1%
 */
contract HUBToken is ERC20, Ownable {
    uint256 public constant FEE_DISCOUNT_THRESHOLD = 1000 * 10**18; // 1000 HUB
    
    // Faucet settings
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18; // 100 HUB per claim
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    mapping(address => uint256) public lastFaucetClaim;
    
    // Swap settings (MON → HUB)
    uint256 public hubPerMON = 1000 * 10**18; // 1 MON = 1000 HUB
    bool public swapEnabled = true;
    
    event FaucetClaimed(address indexed user, uint256 amount);
    event TokensSwapped(address indexed user, uint256 monAmount, uint256 hubAmount);
    event SwapRateUpdated(uint256 newRate);
    
    constructor(uint256 initialSupply) ERC20("StakeHub Token", "HUB") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @notice Check if address qualifies for fee discount
     * @param account Address to check
     * @return true if balance >= threshold
     */
    function hasFeeDiscount(address account) external view returns (bool) {
        return balanceOf(account) >= FEE_DISCOUNT_THRESHOLD;
    }
    
    /**
     * @notice Mint additional tokens (owner only)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Claim free HUB tokens from faucet (once per 24h)
     */
    function claimFaucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown active"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @notice Swap MON for HUB tokens
     */
    function swapMONForHUB() external payable {
        require(swapEnabled, "Swap disabled");
        require(msg.value > 0, "Must send MON");
        
        uint256 hubAmount = (msg.value * hubPerMON) / 10**18;
        _mint(msg.sender, hubAmount);
        
        emit TokensSwapped(msg.sender, msg.value, hubAmount);
    }
    
    /**
     * @notice Update swap rate (owner only)
     */
    function setSwapRate(uint256 newRate) external onlyOwner {
        hubPerMON = newRate;
        emit SwapRateUpdated(newRate);
    }
    
    /**
     * @notice Toggle swap functionality (owner only)
     */
    function setSwapEnabled(bool enabled) external onlyOwner {
        swapEnabled = enabled;
    }
    
    /**
     * @notice Withdraw collected MON (owner only)
     */
    function withdrawMON() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No MON to withdraw");
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Get time until user can claim faucet again
     */
    function getFaucetCooldown(address user) external view returns (uint256) {
        uint256 nextClaim = lastFaucetClaim[user] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextClaim) return 0;
        return nextClaim - block.timestamp;
    }
}
