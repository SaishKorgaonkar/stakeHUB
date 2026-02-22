/**
 * IPFS utilities for metadata upload
 * Using Pinata for IPFS pinning
 */

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload JSON metadata to IPFS via Pinata
 */
export async function uploadToIPFS(metadata: any): Promise<string> {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `arena-${Date.now()}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('IPFS upload failed');
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Upload file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({
      name: file.name,
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Fetch metadata from IPFS
 */
export async function fetchFromIPFS(cid: string): Promise<any> {
  try {
    const response = await fetch(`${PINATA_GATEWAY}${cid}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from IPFS');
    }

    return await response.json();
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw error;
  }
}

/**
 * Get IPFS URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  return `${PINATA_GATEWAY}${cid}`;
}
