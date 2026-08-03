export type ProductCategory = "veg" | "non-veg";
export interface Product { id: string; name: string; category: ProductCategory; tags: readonly string[]; image: string; description: string; preorder: false }
const base = "/assets/images/products/";
export const products: readonly Product[] = [
  { id:"brown-gravy-premix", name:"Brown Gravy Premix", category:"veg", tags:["veg","gravy"], image:base+"brown-gravy-premix.jpeg", description:"A versatile Vijaya Premix gravy base for convenient home cooking.", preorder:false },
  { id:"all-purpose-gravy-premix", name:"All-Purpose Gravy Premix", category:"veg", tags:["veg","gravy","all purpose","all-purpose"], image:base+"all-purpose-gravy-premix.jpeg", description:"An adaptable Vijaya Premix gravy base for a variety of dishes.", preorder:false },
  { id:"butter-chicken-premix", name:"Butter Chicken Premix", category:"non-veg", tags:["non-veg","chicken","gravy"], image:base+"butter-chicken-premix.jpeg", description:"Vijaya Premix for preparing the classic butter chicken dish at home.", preorder:false },
  { id:"chicken-tikka-premix", name:"Chicken Tikka Premix", category:"non-veg", tags:["non-veg","chicken","tikka"], image:base+"chicken-tikka-premix.jpeg", description:"Vijaya Premix for preparing flavourful chicken tikka at home.", preorder:false },
  { id:"fish-fry-premix", name:"Fish Fry Premix", category:"non-veg", tags:["non-veg","fish","fry"], image:base+"fish-fry-premix.jpeg", description:"Vijaya Premix for preparing a flavourful fish fry at home.", preorder:false },
  { id:"fish-gravy-premix", name:"Fish Gravy Premix", category:"non-veg", tags:["non-veg","fish","gravy"], image:base+"fish-gravy-premix.jpeg", description:"Vijaya Premix for preparing a comforting fish gravy at home.", preorder:false },
  { id:"kadhai-chicken-premix", name:"Kadhai Chicken Premix", category:"non-veg", tags:["non-veg","chicken","kadhai","kadai","gravy"], image:base+"kadhai-chicken-premix.jpeg", description:"Vijaya Premix for preparing kadhai chicken at home.", preorder:false }
];
export const productById = (id:string) => products.find((product)=>product.id===id);
export type ProductFilter = "all"|"veg"|"non-veg"|"chicken"|"fish";
export function matchesProduct(product:Product, filter:ProductFilter, query:string) { const filterMatch=filter==="all" || product.category===filter || product.tags.includes(filter); const q=query.trim().toLowerCase(); const queryMatch=!q || (q==="veg" ? product.category==="veg" : q==="non-veg" ? product.category==="non-veg" : `${product.name} ${product.tags.join(" ")}`.toLowerCase().includes(q)); return filterMatch && queryMatch; }
