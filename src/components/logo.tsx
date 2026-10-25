import Image from "next/image";

export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="OpenMedina logo: Medina County in gold at the center of Ohio"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
