pragma solidity 0.6.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProxyContract is Ownable {

  // TODO: establish whether it is better to do these functions within inline assembly
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
