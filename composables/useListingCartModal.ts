import type { NFTWithMetadata } from './useNft'
import {
  nftToListingCartItem,
  shoppingCartItemToListingCartItem,
} from '@/components/common/shoppingCart/utils'
import type { ShoppingCartItem } from '@/components/common/shoppingCart/types'
import type { ListCartItemMediaUrl } from '@/stores/listingCart'

export default ({
  clearItemsOnModalClose = false,
  clearItemsOnBeforeUnmount = false,
  closeModalOnBeforeUnmount = false,
}: {
  clearItemsOnModalClose?: boolean
  clearItemsOnBeforeUnmount?: boolean
  closeModalOnBeforeUnmount?: boolean
} = {}) => {
  const listingCartStore = useListingCartStore()
  const preferencesStore = usePreferencesStore()
  const { isItemInCart } = listingCartStore

  const getFloorPrice = (cartItem: ShoppingCartItem | NFTWithMetadata) =>
    cartItem.collection.floorPrice[0]?.price || '0'

  const tryAddingItemToListingCart = (item: ListCartItem, toggle: boolean = false) => {
    if (!isItemInCart(item.id)) {
      listingCartStore.setItem(item)
    }
    else if (toggle) {
      listingCartStore.removeItem(item.id)
    }
  }

  const listNftByShoppingCartItem = (cartItem: ShoppingCartItem) => {
    tryAddingItemToListingCart(
      shoppingCartItemToListingCartItem(cartItem, getFloorPrice(cartItem)),
    )
  }

  const listNftByNftWithMetadata = (
    nftWithMetadata: NFTWithMetadata,
    { mediaUrl, toggle }: { mediaUrl?: ListCartItemMediaUrl, toggle?: boolean } = {},
  ) => {
    tryAddingItemToListingCart(
      nftToListingCartItem(
        nftWithMetadata,
        getFloorPrice(nftWithMetadata),
        mediaUrl,
      ),
      toggle,
    )
  }

  const openListingCartModal = () =>
    (preferencesStore.listingCartModalOpen = true)

  const closeListingCartModal = () =>
    (preferencesStore.listingCartModalOpen = false)

  const clearItemsInChain = () => {
    listingCartStore.itemsInChain.forEach(item =>
      listingCartStore.removeItem(item.id),
    )
  }

  onBeforeUnmount(() => {
    if (closeModalOnBeforeUnmount) {
      preferencesStore.listingCartModalOpen = false
    }
    if (clearItemsOnBeforeUnmount) {
      clearItemsInChain()
    }
  })

  if (clearItemsOnModalClose) {
    useModalIsOpenTracker({
      isOpen: computed(() => preferencesStore.listingCartModalOpen),
      onChange: clearItemsInChain,
    })
  }

  return {
    listNftByShoppingCartItem,
    listNftByNftWithMetadata,
    openListingCartModal,
    closeListingCartModal,
  }
}
