pragma solidity 0.5.0;

contract Token {

	// Total supply of tokens
	uint256 public totalSupply;

	// Name, symbol and version of the token
	string public name = "TucoCoin";
	string public symbol = "TCC";
	string public standard = "TucoCoin v1.0";

	// Balance of the accounts
	mapping(address => uint256) private balanceOf;
	// Allowances
	mapping(address => mapping(address => uint256)) private approvedTransfers;


	event Transfer(
		address indexed _from,
		address indexed _to,
		uint256 _value
	);

	event Approval(
		address indexed _owner,
		address indexed _spender,
		uint256 _value
	);

	constructor(uint256 _initialSupply) public {
		balanceOf[msg.sender] = _initialSupply;  // Owner
		totalSupply = _initialSupply;
	}

	function myBalance() public view returns (uint256 balance) {
		balance = balanceOf[msg.sender];
	}

	// Transfer tokens
	function transfer(address _to, uint256 _value) public returns (bool success) {
		// Requires that account has enough to transfer
		require(balanceOf[msg.sender] >= _value);
		// Transfer the amount of tokens
		balanceOf[msg.sender] -= _value;
		balanceOf[_to] += _value;
		// Transfer event
		emit Transfer(msg.sender, _to, _value);

		success = true;
	}

	// Approve transfer
	function approve(address _spender, uint256 _value) public returns (bool success) {
		// Recording allowance
		approvedTransfers[msg.sender][_spender] = _value;
		// Emit approval event
		emit Approval(msg.sender, _spender, _value);

		success = true;
	}

	// Show allowance
	function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
		// Require one of the addresses is the sender
		require(msg.sender == _owner || msg.sender == _spender);
		// Returns current allowance
		remaining = approvedTransfers[_owner][_spender];
	}

	// Make previously approved transfer
	function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
		// Require the receiving address is the message sender
		require(msg.sender == _to);

		// Require transfer is approved
		require(approvedTransfers[_from][_to] >= _value);

		// Require owner have the amount
		require(balanceOf[_from] >= _value);

		// Transfer
		balanceOf[_from] -= _value;
		balanceOf[_to] += _value;

		// Update approval
		approvedTransfers[_from][_to] -= _value;

		// Emit transfer event
		emit Transfer(_from, _to, _value);

		success = true;
	}
}