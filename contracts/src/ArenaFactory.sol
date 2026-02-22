// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Arena.sol";
import "./HUBToken.sol";

/**
 * @title ArenaFactory
 * @notice UUPS upgradeable factory for creating Arena contracts
 * @dev Central registry and event emitter for the StakeHub protocol
 */
contract ArenaFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    HUBToken public hubToken;
    address public treasury;
    
    address[] public allArenas;
    mapping(address => bool) public isArena;
    mapping(address => address[]) public creatorArenas;
    
    event ArenaCreated(
        address indexed arenaAddress,
        address indexed creator,
        string ipfsCid,
        uint256 deadline,
        uint256 timestamp
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @notice Initialize the factory (replaces constructor for upgradeable)
     * @param _hubToken Address of HUB token contract
     * @param _treasury Address to receive protocol fees
     */
    function initialize(address _hubToken, address _treasury) public initializer {
        require(_hubToken != address(0), "Invalid HUB token");
        require(_treasury != address(0), "Invalid treasury");
        
        __Ownable_init(msg.sender);
        // __UUPSUpgradeable_init() removed — no-op in OZ v5
        
        hubToken = HUBToken(_hubToken);
        treasury = _treasury;
    }
    
    /**
     * @notice Create a new Arena
     * @param ipfsCid IPFS content ID containing arena metadata
     * @param outcomeLabels Array of outcome labels (e.g., ["YES", "NO"])
     * @param deadline Unix timestamp when arena locks
     * @return arenaAddress Address of the newly created Arena
     */
    function createArena(
        string memory ipfsCid,
        string[] memory outcomeLabels,
        uint256 deadline
    ) external returns (address arenaAddress) {
        require(bytes(ipfsCid).length > 0, "Empty IPFS CID");
        require(outcomeLabels.length >= 2, "Need at least 2 outcomes");
        require(outcomeLabels.length <= 10, "Max 10 outcomes");
        require(deadline > block.timestamp + 1 hours, "Deadline too soon");
        require(deadline < block.timestamp + 365 days, "Deadline too far");
        
        // Deploy new Arena contract
        Arena arena = new Arena(
            msg.sender,
            address(hubToken),
            ipfsCid,
            outcomeLabels,
            deadline
        );
        
        arenaAddress = address(arena);
        
        // Register in mappings
        allArenas.push(arenaAddress);
        isArena[arenaAddress] = true;
        creatorArenas[msg.sender].push(arenaAddress);
        
        emit ArenaCreated(
            arenaAddress,
            msg.sender,
            ipfsCid,
            deadline,
            block.timestamp
        );
        
        return arenaAddress;
    }
    
    /**
     * @notice Update treasury address (owner only)
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @notice Get all arenas created by an address
     */
    function getCreatorArenas(address creator) external view returns (address[] memory) {
        return creatorArenas[creator];
    }
    
    /**
     * @notice Get total number of arenas
     */
    function getArenaCount() external view returns (uint256) {
        return allArenas.length;
    }
    
    /**
     * @notice Get arenas in a range (for pagination)
     */
    function getArenas(uint256 startIndex, uint256 count) external view returns (address[] memory) {
        uint256 total = allArenas.length;
        if (startIndex >= total) return new address[](0);
        
        uint256 endIndex = startIndex + count;
        if (endIndex > total) endIndex = total;
        
        uint256 resultCount = endIndex - startIndex;
        address[] memory result = new address[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = allArenas[startIndex + i];
        }
        
        return result;
    }
    
    /**
     * @dev Authorize upgrade (owner only for UUPS)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
