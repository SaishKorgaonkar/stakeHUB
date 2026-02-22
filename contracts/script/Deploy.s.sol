// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/HUBToken.sol";
import "../src/ArenaFactory.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @notice Deployment script for Monad testnet
 * @dev Run: forge script script/Deploy.s.sol:DeployScript --rpc-url $MONAD_RPC_URL --broadcast --verify
 */
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying from:", deployer);
        console.log("Balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy HUB Token (1M supply)
        uint256 initialSupply = 1_000_000 * 10**18;
        HUBToken hubToken = new HUBToken(initialSupply);
        console.log("HUB Token deployed at:", address(hubToken));
        
        // 2. Deploy ArenaFactory implementation
        ArenaFactory factoryImpl = new ArenaFactory();
        console.log("ArenaFactory implementation:", address(factoryImpl));
        
        // 3. Encode initialization data
        bytes memory initData = abi.encodeWithSelector(
            ArenaFactory.initialize.selector,
            address(hubToken),
            deployer // treasury (can be changed later)
        );
        
        // 4. Deploy ERC1967 Proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(factoryImpl),
            initData
        );
        console.log("ArenaFactory proxy deployed at:", address(proxy));
        
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("HUB Token:", address(hubToken));
        console.log("ArenaFactory:", address(proxy));
        console.log("Treasury:", deployer);
        console.log("\nAdd to .env:");
        console.log("HUB_TOKEN_ADDRESS=%s", address(hubToken));
        console.log("ARENA_FACTORY_ADDRESS=%s", address(proxy));
    }
}
