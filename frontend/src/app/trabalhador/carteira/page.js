'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CarteiraPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/trabalhador/ganhos');
  }, [router]);

  return null;
}
