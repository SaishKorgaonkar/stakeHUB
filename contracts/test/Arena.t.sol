// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Arena.sol";
import "../src/ArenaFactory.sol";
import "../src/HUBToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ArenaTest is Test {
    ArenaFactory public factory;
    HUBToken public hubToken;
    Arena public arena;
    
    address public creator = address(0x1);
    address public staker1 = address(0x2);
    address public staker2 = address(0x3);
    address public treasury = address(0x999);
    
    uint256 constant INITIAL_SUPPLY = 1_000_000 * 10**18;
    
    function setUp() public {
        // Deploy HUB token
        hubToken = new HUBToken(INITIAL_SUPPLY);
        
        // Deploy factory with proxy
        ArenaFactory factoryImpl = new ArenaFactory();
        bytes memory initData = abi.encodeWithSelector(
            ArenaFactory.initialize.selector,
            address(hubToken),
            treasury
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(factoryImpl), initData);
        factory = ArenaFactory(address(proxy));
        
        // Fund test accounts
        vm.deal(creator, 100 ether);
        vm.deal(staker1, 100 ether);
        vm.deal(staker2, 100 ether);
    }
    
    function testCreateArena() public {
        vm.startPrank(creator);
        
        string[] memory outcomes = new string[](2);
        outcomes[0] = "YES";
        outcomes[1] = "NO";
        
        uint256 deadline = block.timestamp + 7 days;
        
        address arenaAddr = factory.createArena(
            "QmTest123",
            outcomes,
            deadline
        );
        
        assertTrue(factory.isArena(arenaAddr));
        assertEq(factory.getArenaCount(), 1);
        
        Arena newArena = Arena(arenaAddr);
        assertEq(newArena.creator(), creator);
        assertEq(newArena.deadline(), deadline);
        
        vm.stopPrank();
    }
    
    function testStake() public {
        // Create arena
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "YES";
        outcomes[1] = "NO";
        address arenaAddr = factory.createArena("QmTest", outcomes, block.timestamp + 7 days);
        vm.stopPrank();
        
        arena = Arena(arenaAddr);
        
        // Stake on YES
        vm.prank(staker1);
        arena.stake{value: 10 ether}(0);
        
        // Stake on NO
        vm.prank(staker2);
        arena.stake{value: 5 ether}(1);
        
        assertEq(arena.totalPool(), 15 ether);
        assertEq(arena.stakes(staker1, 0), 10 ether);
        assertEq(arena.stakes(staker2, 1), 5 ether);
    }
    
    function testResolveAndClaim() public {
        // Setup arena with stakes
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "YES";
        outcomes[1] = "NO";
        address arenaAddr = factory.createArena("QmTest", outcomes, block.timestamp + 7 days);
        vm.stopPrank();
        
        arena = Arena(arenaAddr);
        
        vm.prank(staker1);
        arena.stake{value: 10 ether}(0); // YES
        
        vm.prank(staker2);
        arena.stake{value: 5 ether}(1); // NO
        
        // Lock and resolve
        vm.startPrank(creator);
        arena.lockArena();
        arena.resolve(0); // YES wins
        vm.stopPrank();
        
        assertEq(uint(arena.state()), uint(Arena.State.RESOLVED));
        
        // Winner claims
        uint256 winnings = arena.calculateWinnings(staker1);
        assertTrue(winnings > 10 ether); // Should be more than original stake
        
        uint256 balanceBefore = staker1.balance;
        vm.prank(staker1);
        arena.claim();
        uint256 balanceAfter = staker1.balance;
        
        assertEq(balanceAfter - balanceBefore, winnings);
    }
    
    function testEmergencyCancel() public {
        vm.startPrank(creator);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "YES";
        outcomes[1] = "NO";
        address arenaAddr = factory.createArena("QmTest", outcomes, block.timestamp + 7 days);
        arena = Arena(arenaAddr);
        arena.lockArena();
        vm.stopPrank();
        
        vm.prank(staker1);
        arena.stake{value: 10 ether}(0);
        
        // Fast forward past emergency deadline
        vm.warp(arena.emergencyDeadline() + 1);
        
        // Anyone can cancel
        vm.prank(staker2);
        arena.emergencyCancel();
        
        assertEq(uint(arena.state()), uint(Arena.State.CANCELLED));
        
        // Staker can refund
        uint256 balanceBefore = staker1.balance;
        vm.prank(staker1);
        arena.refund();
        assertEq(staker1.balance - balanceBefore, 10 ether);
    }
    
    function testFeeDiscount() public {
        // Give creator HUB tokens for discount
        hubToken.transfer(creator, 1000 * 10**18);
        
        assertTrue(hubToken.hasFeeDiscount(creator));
    }
}
