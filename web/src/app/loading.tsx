import { Container } from "@/components/layout/container";
import { CardListSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container width="default" className="py-10">
      <CardListSkeleton />
    </Container>
  );
}
