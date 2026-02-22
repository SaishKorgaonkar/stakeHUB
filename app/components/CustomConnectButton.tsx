'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from './ui/Button';

export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button size="lg" variant="primary" onClick={openConnectModal}>
                    CONNECT WALLET
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button size="lg" variant="secondary" onClick={openChainModal}>
                    WRONG NETWORK
                  </Button>
                );
              }

              return (
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={openChainModal}
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? 'Chain icon'}
                        src={chain.iconUrl}
                        className="w-4 h-4 mr-2 inline-block"
                      />
                    )}
                    {chain.name}
                  </Button>

                  <Button size="lg" variant="primary" onClick={openAccountModal}>
                    {account.displayName}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
