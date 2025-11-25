// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OneStreamNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    string private _baseTokenURI;

    constructor(
        address initialOwner,
        string memory baseURI
    ) ERC721("OneStream", "OST") Ownable(initialOwner) {
        nextTokenId = 1;
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Mint NFT - public minting function
     * @param to Address to mint NFT to
     * @param tokenURI URI for the token metadata (will be appended to baseURI)
     * @return tokenId The ID of the minted token
     */
    function mintTo(address to, string calldata tokenURI) external returns (uint256) {
        uint256 id = nextTokenId;
        nextTokenId++;
        
        _safeMint(to, id);
        _setTokenURI(id, tokenURI);
        
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Burn function - only token owner can burn
     */
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Only token owner can burn");
        _burn(tokenId);
    }
}

