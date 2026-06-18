export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image?: string;
}
