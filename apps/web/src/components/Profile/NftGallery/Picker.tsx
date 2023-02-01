import SingleNFT from '@components/NFT/SingleNFT';
import NFTShimmer from '@components/Shared/Shimmer/NFTShimmer';
import { EmptyState } from '@components/UI/EmptyState';
import { ErrorMessage } from '@components/UI/ErrorMessage';
import InfiniteLoader from '@components/UI/InfiniteLoader';
import { Input } from '@components/UI/Input';
import { Tab } from '@headlessui/react';
import { CheckIcon, CollectionIcon, SearchIcon, XIcon } from '@heroicons/react/outline';
import formatHandle from '@lib/formatHandle';
import { t, Trans } from '@lingui/macro';
import clsx from 'clsx';
import { IS_MAINNET, SCROLL_THRESHOLD } from 'data/constants';
import type { Nft, NfTsRequest } from 'lens';
import { useNftFeedQuery } from 'lens';
import type { ChangeEvent, FC } from 'react';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { CHAIN_ID } from 'src/constants';
import { useAppStore } from 'src/store/app';
import { useNftGalleryStore } from 'src/store/nft-gallery';
import { mainnet } from 'wagmi/chains';

const tabs = [{ name: 'Recent' }, { name: 'Floor price' }, { name: 'A-Z' }];

const Picker: FC = () => {
  const [searchText, setSearchText] = useState('');
  const currentProfile = useAppStore((state) => state.currentProfile);
  const gallery = useNftGalleryStore((state) => state.gallery);
  const setGallery = useNftGalleryStore((state) => state.setGallery);

  // Variables
  const request: NfTsRequest = {
    chainIds: IS_MAINNET ? [CHAIN_ID, mainnet.id] : [CHAIN_ID],
    ownerAddress: currentProfile?.ownedBy,
    limit: 10
  };

  const { data, loading, fetchMore, error } = useNftFeedQuery({
    variables: { request },
    skip: !currentProfile?.ownedBy
  });

  const nfts = data?.nfts?.items;
  const pageInfo = data?.nfts?.pageInfo;
  const hasMore = pageInfo?.next && nfts?.length !== pageInfo.totalCount;

  const loadMore = async () => {
    await fetchMore({
      variables: { request: { ...request, cursor: pageInfo?.next } }
    });
  };

  if (loading) {
    return (
      <div className="m-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NFTShimmer />
        <NFTShimmer />
        <NFTShimmer />
        <NFTShimmer />
        <NFTShimmer />
        <NFTShimmer />
      </div>
    );
  }

  if (nfts?.length === 0) {
    return (
      <EmptyState
        message={
          <div>
            <span className="mr-1 font-bold">@{formatHandle(currentProfile?.handle)}</span>
            <span>
              <Trans>doesn't have any NFTs!</Trans>
            </span>
          </div>
        }
        icon={<CollectionIcon className="text-brand h-8 w-8" />}
      />
    );
  }

  if (error) {
    return <ErrorMessage title={t`Failed to load nft feed`} error={error} />;
  }

  const handleSearch = (evt: ChangeEvent<HTMLInputElement>) => {
    const keyword = evt.target.value;
    setSearchText(keyword);
  };

  const selectedItems = gallery.items.map((n) => n.id);

  const onSelectItem = (item: Nft) => {
    const id = `${item.chainId}_${item.contractAddress}_${item.tokenId}`;
    const nft = {
      id,
      ...item
    };
    const index = gallery.items.findIndex((n) => n.id === id);
    if (index !== -1) {
      const nfts = gallery.items;
      nfts.splice(index, 1);
      setGallery({ name: gallery.name, items: nfts });
    } else {
      setGallery({ name: gallery.name, items: [...gallery.items, nft] });
    }
  };

  return (
    <div className="m-5 space-y-4">
      <Input
        type="text"
        className="py-2 px-3 text-sm"
        placeholder="Search"
        value={searchText}
        iconLeft={<SearchIcon />}
        iconRight={
          <XIcon
            className={clsx('cursor-pointer', searchText ? 'visible' : 'invisible')}
            onClick={() => {
              setSearchText('');
            }}
          />
        }
        onChange={handleSearch}
      />
      <Tab.Group>
        <Tab.List className="space-x-2">
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              className={clsx(
                'Recent' === tab.name ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand',
                'bg-brand-100 border-brand-300 dark:border-brand-500 rounded-full border px-3 py-1.5 text-xs dark:bg-opacity-20 sm:px-4'
              )}
            >
              <span className="flex items-center space-x-2">
                <span className="hidden sm:block">{tab.name}</span>
              </span>
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
      <InfiniteScroll
        dataLength={nfts?.length ?? 0}
        scrollThreshold={SCROLL_THRESHOLD}
        hasMore={hasMore}
        next={loadMore}
        loader={<InfiniteLoader />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {nfts?.map((nft) => {
            const id = `${nft.chainId}_${nft.contractAddress}_${nft.tokenId}`;
            const isSelected = selectedItems.includes(id);
            return (
              <div key={id}>
                <div
                  className={clsx(
                    'relative rounded-xl border-2',
                    isSelected ? 'border-brand-500' : 'border-transparent'
                  )}
                >
                  {isSelected && (
                    <button className="bg-brand-500 absolute right-2 top-2 rounded-full">
                      <CheckIcon className="h-5 w-5 p-1 text-white" />
                    </button>
                  )}
                  <button className="w-full text-left" onClick={() => onSelectItem(nft as Nft)}>
                    <SingleNFT nft={nft as Nft} linkToDetail={false} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default Picker;
