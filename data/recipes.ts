import { products } from "./products";
export interface Recipe { id:string; title:string; category:"veg"|"non-veg"; mealType:"dinner"; difficulty:"See pack"; image:string; description:string; related:string }
export const recipes:readonly Recipe[]=products.map((p)=>({id:p.id.replace(/-premix$/, ""),title:p.name.replace(/ Premix$/, ""),category:p.category,mealType:"dinner",difficulty:"See pack",image:p.image,description:`A serving idea using ${p.name}. Follow the directions printed on the official pack.`,related:p.id}));
