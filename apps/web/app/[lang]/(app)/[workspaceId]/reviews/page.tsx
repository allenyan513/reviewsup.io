'use client';

import React, { use } from 'react';
import ReviewListPage from '@/modules/review/review-list-page';

export default function Page(props: {
  params: Promise<{
    lang: string;
    workspaceId: string;
  }>;
}) {
  const { lang, workspaceId } = use(props.params);
  return (
    <ReviewListPage lang={lang} workspaceId={workspaceId} status={undefined} />
  );
}
