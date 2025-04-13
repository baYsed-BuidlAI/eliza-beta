// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

/**
 * @title TrbtcAirdrop
 * @dev Rootstock 테스트넷에서 tRBTC 에어드랍을 위한 간단한 컨트랙트
 */
contract TrbtcAirdrop {
    address public owner;
    mapping(address => bool) public claimed;
    mapping(address => uint256) public claimableAmount;
    uint256 public totalAirdropAmount;
    uint256 public remainingAirdropAmount;
    bool public isAirdropActive;
    
    event AirdropCreated(uint256 totalAmount);
    event AirdropClaimed(address indexed recipient, uint256 amount);
    event AirdropStatusChanged(bool isActive);
    event AirdropAmountSet(address indexed recipient, uint256 amount);
    event EmergencyWithdrawal(uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }
    
    modifier whenActive() {
        require(isAirdropActive, "Airdrop is not active");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        isAirdropActive = false;
    }
    
    /**
     * @dev 컨트랙트에 에어드랍 자금 입금
     */
    function fundAirdrop() external payable onlyOwner {
        totalAirdropAmount += msg.value;
        remainingAirdropAmount += msg.value;
        
        emit AirdropCreated(msg.value);
    }
    
    /**
     * @dev 에어드랍 상태 설정
     * @param _isActive 활성화 여부
     */
    function setAirdropStatus(bool _isActive) external onlyOwner {
        isAirdropActive = _isActive;
        emit AirdropStatusChanged(_isActive);
    }
    
    /**
     * @dev 개별 주소에 대한 에어드랍 금액 설정
     * @param _recipients 수령인 주소 배열
     * @param _amounts 각 수령인에 대한 에어드랍 금액 배열
     */
    function setAirdropAmounts(address[] calldata _recipients, uint256[] calldata _amounts) external onlyOwner {
        require(_recipients.length == _amounts.length, "Arrays must have the same length");
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Cannot set for zero address");
            claimableAmount[_recipients[i]] = _amounts[i];
            emit AirdropAmountSet(_recipients[i], _amounts[i]);
        }
    }
    
    /**
     * @dev 에어드랍 청구
     */
    function claimAirdrop() external whenActive {
        address recipient = msg.sender;
        require(!claimed[recipient], "Airdrop already claimed");
        require(claimableAmount[recipient] > 0, "No airdrop available");
        require(remainingAirdropAmount >= claimableAmount[recipient], "Insufficient contract balance");
        
        uint256 amount = claimableAmount[recipient];
        claimed[recipient] = true;
        remainingAirdropAmount -= amount;
        
        payable(recipient).transfer(amount);
        
        emit AirdropClaimed(recipient, amount);
    }
    
    /**
     * @dev 여러 주소에 한 번에 에어드랍 전송 (가스 절약)
     * @param _recipients 수령인 주소 배열
     */
    function batchAirdrop(address[] calldata _recipients) external onlyOwner whenActive {
        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            
            if (claimed[recipient] || claimableAmount[recipient] == 0) {
                continue;
            }
            
            if (remainingAirdropAmount < claimableAmount[recipient]) {
                break;
            }
            
            claimed[recipient] = true;
            remainingAirdropAmount -= claimableAmount[recipient];
            
            payable(recipient).transfer(claimableAmount[recipient]);
            
            emit AirdropClaimed(recipient, claimableAmount[recipient]);
        }
    }
    
    /**
     * @dev 특정 주소의 에어드랍 자격 확인
     * @param _address 확인할 주소
     * @return 에어드랍 청구 가능 여부
     */
    function isEligible(address _address) external view returns (bool) {
        return !claimed[_address] && claimableAmount[_address] > 0;
    }
    
    /**
     * @dev 컨트랙트 잔액 확인
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 비상 상황 시 남은 tRBTC 인출 (오너만 가능)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Contract has no balance");
        
        payable(owner).transfer(balance);
        remainingAirdropAmount = 0;
        
        emit EmergencyWithdrawal(balance);
    }
} 