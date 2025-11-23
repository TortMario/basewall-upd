// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OneStreamNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    
    // Optional: allow public minting or restrict to owner
    bool public publicMintingEnabled;

    constructor(address initialOwner) ERC721("OneStream Post", "OSTR") Ownable(initialOwner) {
        nextTokenId = 1;
        publicMintingEnabled = true; // Set to false if you want only owner to mint
    }

    function mintTo(address to, string calldata tokenURI) external returns (uint256) {
        require(publicMintingEnabled || msg.sender == owner(), "Minting not allowed");
        
        uint256 id = nextTokenId;
        nextTokenId++;
        
        _safeMint(to, id);
        _setTokenURI(id, tokenURI);
        
        return id;
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Burn function - only token owner can burn
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Only token owner can burn");
        _burn(tokenId);
    }

    // Owner functions
    function setPublicMinting(bool enabled) external onlyOwner {
        publicMintingEnabled = enabled;
    }
}

