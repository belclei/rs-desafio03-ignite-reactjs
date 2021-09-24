import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storedCart = localStorage.getItem('@RocketShoes:cart')

    if (storedCart) {
      return JSON.parse(storedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      const auxCart = [...cart]
      const productInCart = auxCart.find(product => product.id === productId)

      const { data } = await api.get(`/stock/${productId}`)
      const newAmount = productInCart ? productInCart.amount + 1 : 1

      if (data.amount < newAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if (productInCart) {
        productInCart.amount = newAmount
      } else {
        const { data: product } = await api.get(`/products/${productId}`)
        auxCart.push({ ...product, amount: 1 })
      }
      setCart(auxCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(auxCart))
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      if (cart.findIndex(product => product.id === productId) < 0) {
        throw Error()
      }
      const newCart = cart.filter(product => product.id !== productId)

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    if (amount <= 0) return
    try {
      const { data } = await api.get(`/stock/${productId}`)

      if (data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const auxCart = cart.map(product => {
        if (product.id === productId) {
          product.amount = amount
        }
        return product
      })
      setCart(auxCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(auxCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
