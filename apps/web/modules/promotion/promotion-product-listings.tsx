'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useSession } from '@/context/UserProvider';
import {
  ProductCategory,
  ProductEntity,
  ProductStatus,
  findAllRequestSchema,
} from '@reviewsup/api/products';
import { ReviewEntity } from '@reviewsup/api/reviews';
import { Input } from '@reviewsup/ui/input';
import { Checkbox } from '@reviewsup/ui/checkbox';
import { Label } from '@reviewsup/ui/label';
import { ProductItemView } from '@/modules/promotion/promotion-product-item-view';

export function PromotionProductListings(props: {
  lang: string;
  workspaceId: string;
  status: 'pendingForReceive' | 'listing';
}) {
  const { lang, workspaceId, status } = props;
  const { user } = useSession();
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [originalProducts, setOriginalProducts] = useState<ProductEntity[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<ReviewEntity[]>([]);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);

  const fetchData = () => {
    if (!workspaceId) {
      return null;
    }
    const validatedRequest = findAllRequestSchema.parse({
      status: [status],
      page: page,
      pageSize: pageSize,
      search: undefined,
      categories: categories,
    });
    api.product
      .findAll(validatedRequest)
      .then((response) => {
        setProducts(response);
        setOriginalProducts(response);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      });
  };

  useEffect(() => {
    fetchData();

    if (user) {
      api.review
        .findAllByReviewerId(user.id)
        .then((response) => {
          setSubmittedReviews(response);
          console.log('Submitted reviews:', response);
        })
        .catch((error) => {
          console.error('Error fetching reviews:', error);
        });
    }
  }, [workspaceId, user]);

  useEffect(() => {
    fetchData();
  }, [categories]);

  useEffect(() => {
    if (search.trim() === '') {
      setProducts(originalProducts);
    } else {
      setProducts(
        originalProducts.filter((product) =>
          product?.name?.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    }
  }, [search, originalProducts]);

  return (
    <div className="p-4 md:p-8 flex flex-col">
      <div className="flex flex-row justify-between items-center mb-8">
        <div>
          <Link
            href={`/${lang}/${workspaceId}/forms`}
            className="flex flex-row items-center gap-2 "
          >
            <h1 className="text-3xl font-semibold text-gray-900 line-clamp-1">
              {/*Listing in Queue*/}
              { status === 'pendingForReceive' && 'Pending Products' }
              { status === 'listing' && 'Public Products' }
            </h1>
          </Link>
          <p className="mt-1 text-gray-600 hidden md:flex">
            Review other products to receive feedback on your own.
          </p>
        </div>
        <div className={'flex flex-row gap-1 md:gap-2'}></div>
      </div>
      <div className="grid grid-cols-12 gap-16">
        {/* 搜索，筛选 分类，*/}
        <div className="col-span-2 flex flex-col gap-4">
          <h2>Filter Products</h2>
          <Input
            type="text"
            placeholder="Search products..."
            className="mb-4"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
          <h2>Categories</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(ProductCategory).map(([key, value]) => (
              <div
                className="flex flex-row items-center gap-2 bg-gray-50 p-3 rounded-md hover:bg-gray-100"
                key={key}
              >
                <Checkbox
                  key={key}
                  id={key}
                  className="border-gray-400"
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setCategories((prev) => [...prev, key]);
                    } else {
                      setCategories((prev) =>
                        prev.filter((category) => category !== key),
                      );
                    }
                  }}
                />
                <Label
                  htmlFor={key}
                  className="text-sm w-full cursor-pointer font-normal"
                >
                  {/*capitalize the first letter of each word*/}
                  {value
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/*  产品grid*/}
        <div className="col-span-10 grid grid-cols-3 items-start gap-4">
          { products.length === 0 && (
            <div className="col-span-3 text-center text-gray-500">
              No products found.
            </div>
          )}
          {products &&
            products.map((product) => (
              <ProductItemView
                key={product.id}
                product={product}
                user={user}
                submittedReviews={submittedReviews}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
