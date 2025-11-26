// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract OneStreamNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    string private _baseTokenURI;
    
    // Minting fee: 0.05 USD (approximately 0.0001 ETH at current prices)
    // This is a fixed fee that goes to the contract owner
    uint256 public constant MINT_FEE = 0.0001 ether; // ~0.05 USD
    
    // Royalty percentage: 3% (300 basis points)
    uint96 public constant ROYALTY_PERCENTAGE = 300; // 3% = 300/10000

    constructor(
        address initialOwner,
        string memory baseURI
    ) ERC721("OneStream", "OST") Ownable(initialOwner) {
        nextTokenId = 1;
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Mint NFT - public minting function with fee
     * @param to Address to mint NFT to
     * @param tokenURI URI for the token metadata
     * @return tokenId The ID of the minted token
     */
    function mintTo(address to, string calldata tokenURI) external payable returns (uint256) {
        require(msg.value >= MINT_FEE, "Insufficient payment: 0.05 USD required");
        
        uint256 id = nextTokenId;
        nextTokenId++;
        
        _safeMint(to, id);
        _setTokenURI(id, tokenURI);
        
        // Send mint fee to owner
        if (msg.value > 0) {
            (bool sent, ) = owner().call{value: msg.value}("");
            require(sent, "Failed to send payment to owner");
        }
        
        return id;
    }

    /**
     * @dev Get base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Update base URI (only owner)
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    // Override required by Solidity
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Burn function - only token owner can burn
     */
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Only token owner can burn");
        _burn(tokenId);
    }

    /**
     * @dev ERC2981 royalty standard - 3% royalty to contract owner
     */
    function royaltyInfo(uint256 /* tokenId */, uint256 salePrice) 
        external 
        view 
        returns (address receiver, uint256 royaltyAmount) 
    {
        receiver = owner();
        royaltyAmount = (salePrice * ROYALTY_PERCENTAGE) / 10000; // 3% = 300/10000
    }

    /**
     * @dev Support ERC2981 interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Withdraw function for owner to withdraw accumulated fees
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool sent, ) = owner().call{value: balance}("");
        require(sent, "Failed to withdraw");
    }
}

