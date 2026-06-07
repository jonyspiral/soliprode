import { PaymentReturnScreen } from "@/components/payments/payment-return-screen";

type PaymentReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PagoPendingPage({ searchParams }: PaymentReturnPageProps) {
  return <PaymentReturnScreen kind="pending" searchParams={await searchParams} />;
}
