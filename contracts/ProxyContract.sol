pragma solidity 0.6.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract Test {

  function log(bytes32 msg) public view{
    console.log(bytes32ToString(msg));
  }

  function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}

contract ProxyContract is Ownable {

  // TODO: establish whether it is better to do these functions within inline assembly
  // We need inline assembly to get the returned values from these functions, however none of the functions in ClearingHouse reeturn anything
  function executeCall(
    address target,
    bytes calldata callData
  ) external onlyOwner() returns (bytes memory result) {
    bool success;
    (success, result) = target.call(callData);
    require(success, 'Error executing call');
  }

  function executeDelegateCall(
    address target,
    bytes calldata callData
  ) external onlyOwner() returns (bytes memory result) {
    bool success;
    (success, result) = target.delegatecall(callData);
    require(success, 'Error executing delegatecall');
  }

}

contract ProxyFactory {
  event Created(address indexed owner, address indexed proxy);
  mapping (address => address) public getProxy;

  function spawn() public returns (address proxy) {
    address owner = msg.sender;
    require(getProxy[owner] == address(0), 'Already has proxy');

    bytes memory bytecode = type(ProxyContract).creationCode;
    bytes32 salt = keccak256(abi.encodePacked(msg.sender));
    assembly {
      proxy := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }

    emit Created(owner, address(proxy));
    ProxyContract(proxy).transferOwnership(owner);
    getProxy[owner] = proxy;
  }

}
