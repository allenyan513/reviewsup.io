import React from 'react';
import Link from 'next/link';
import { ProductEntity } from '@reviewsup/api/products';
import { buttonVariants } from '@reviewsup/ui/button';
import { ReviewEntity } from '@reviewsup/api/reviews';
import StarRating from '@reviewsup/ui/star-rating';

export function ProductItemView(props: { product: ProductEntity }) {
  const { product } = props;

  const renderRating = (product: ProductEntity) => {
    if (!product.form) {
      return null;
    }
    const reviews = (product.form.Review as ReviewEntity[]) || [];
    const totalRating = reviews.reduce(
      (acc, review) => acc + (review?.rating || 0),
      0,
    );
    const rating = (totalRating / reviews.length).toFixed(1);

    return (
      <div className="flex flex-row items-center gap-2 text-sm">
        <span className="text-yellow-500 font-bold">{rating}</span>
        <StarRating
          className="mt-[1px]"
          size={'sm'}
          value={parseFloat(rating)}
        />
        <span className="text-black text-md">({reviews.length} reviews)</span>
      </div>
    );
  };

  const renderButton = (product: ProductEntity) => {
    return (
      <Link
        href={`${process.env.NEXT_PUBLIC_APP_URL}/forms/${product.form?.shortId}`}
        target="_blank"
        className='rounded-md  text-sm m-2 bg-red-400 text-white p-2 text-center hover:bg-red-500 '
      >
        Leave a Review
      </Link>
    );
  };
  return (
    <div
      key={product.id}
      className="border border-gray-200 rounded-md bg-white shadow-md flex flex-col flex-grow"
    >
      {product.screenshot ? (
        <Link href={`/products/${product.slug}`}>
          <img
            className="w-full rounded-t-md border-b aspect-video object-cover"
            src={product.screenshot}
            alt={product.name}
          />
        </Link>
      ) : (
        <div className="w-full rounded-t-md border-b aspect-video bg-gray-100 flex items-center justify-center"></div>
      )}
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-col flex-grow gap-2 p-4"
      >
        <div className="flex flex-row items-center gap-2">
          {product.icon ? (
            <img className="w-5 h-5" src={product.icon} alt={product.name} />
          ) : (
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center"></div>
          )}
          <h2 className="line-clamp-1">
            {product.name ? product.name : 'YOUR PRODUCT NAME'}
          </h2>
        </div>
        <p className="text-sm text-gray-600 min-h-10 line-clamp-2 whitespace-break-spaces overflow-x-hidden">
          {product.description
            ? product.description
            : 'YOUR PRODUCT DESCRIPTION'}
        </p>
        {/*<div className="text-sm text-gray-500">*/}
        {/*  <span>#{product.category}</span>*/}
        {/*</div>*/}
        {/*{renderButton(product)}*/}
        {renderRating(product)}
      </Link>
    </div>
  );
}
