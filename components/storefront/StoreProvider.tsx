"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "@/lib/products/public-types";

interface CartLine { id:string; qty:number; type:"product" }
interface User { id?:string; name:string; email:string }
interface Store { products:PublicProduct[]; cart:CartLine[]; wishlist:string[]; user:User|null; hydrated:boolean; add:(id:string)=>void; setQty:(id:string,qty:number)=>void; remove:(id:string)=>void; toggleWish:(id:string)=>void; toast:(message:string)=>void }
const Context=createContext<Store|null>(null);
const safeParse=<T,>(value:string|null,fallback:T):T=>{try{return value?JSON.parse(value) as T:fallback}catch{return fallback}};
export function StoreProvider({children,products,initialUser}:{children:React.ReactNode;products:PublicProduct[];initialUser:User|null}){
 const [cart,setCart]=useState<CartLine[]>([]),[wishlist,setWishlist]=useState<string[]>([]),[hydrated,setHydrated]=useState(false),[messages,setMessages]=useState<{id:number;text:string}[]>([]);
 useEffect(()=>{const ids=new Set(products.map(p=>p.id)); const raw=safeParse<CartLine[]>(localStorage.getItem("vijaya_cart"),[]); const clean=Array.isArray(raw)?raw.filter(x=>x?.type==="product"&&ids.has(x.id)&&Number.isInteger(x.qty)&&x.qty>0):[]; const wishes=safeParse<string[]>(localStorage.getItem("vijaya_wishlist"),[]).filter(id=>ids.has(id)); setCart(clean);setWishlist(wishes); localStorage.setItem("vijaya_cart",JSON.stringify(clean));localStorage.setItem("vijaya_wishlist",JSON.stringify(wishes));localStorage.removeItem("vijaya_user");sessionStorage.removeItem("vijaya_user");setHydrated(true)},[products]);
 useEffect(()=>{if(hydrated)localStorage.setItem("vijaya_cart",JSON.stringify(cart))},[cart,hydrated]); useEffect(()=>{if(hydrated)localStorage.setItem("vijaya_wishlist",JSON.stringify(wishlist))},[wishlist,hydrated]);
 const toast=useCallback((text:string)=>{const id=Date.now();setMessages(m=>[...m,{id,text}]);window.setTimeout(()=>setMessages(m=>m.filter(x=>x.id!==id)),2600)},[]);
 const hasProduct=useCallback((id:string)=>products.some(product=>product.id===id),[products]);
 const add=useCallback((id:string)=>{if(!hasProduct(id))return;setCart(lines=>{const line=lines.find(x=>x.id===id);return line?lines.map(x=>x.id===id?{...x,qty:x.qty+1}:x):[...lines,{id,qty:1,type:"product"}]});toast("Added to your kitchen!")},[hasProduct,toast]);
 const setQty=useCallback((id:string,qty:number)=>setCart(lines=>qty<1?lines.filter(x=>x.id!==id):lines.map(x=>x.id===id?{...x,qty}:x)),[]); const remove=useCallback((id:string)=>setCart(lines=>lines.filter(x=>x.id!==id)),[]);
 const toggleWish=useCallback((id:string)=>{if(!hasProduct(id))return;setWishlist(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id])},[hasProduct]);
 const value=useMemo(()=>({products,cart,wishlist,user:initialUser,hydrated,add,setQty,remove,toggleWish,toast}),[products,cart,wishlist,initialUser,hydrated,add,setQty,remove,toggleWish,toast]);
 return <Context.Provider value={value}>{children}<div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2" aria-live="polite">{messages.map(m=><div key={m.id} className="toast rounded-full bg-vijaya-dark px-5 py-3 text-sm font-bold text-white shadow-card">{m.text}</div>)}</div></Context.Provider>
}
export function useStore(){const value=useContext(Context);if(!value)throw new Error("useStore requires StoreProvider");return value}
