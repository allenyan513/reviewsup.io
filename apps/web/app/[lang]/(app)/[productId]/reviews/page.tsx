'use client';

import React, { use } from 'react';
import ReviewListPage from '@/modules/review/review-list-page';

export default function Page(props: {
  params: Promise<{
    lang: string;
    productId: string;
  }>;
}) {
  const { lang, productId } = use(props.params);
  return (
    <ReviewListPage
      lang={lang}
      productId={productId}
      status={undefined}
      mode="productId"
    />
  );
}
