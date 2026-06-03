import Image from "next/image";
import { cn } from "@/lib/utils";

/** Public asset: public/Exceed Logo  with Mottto.png */
export const EXCEED_LOGO_SRC = "/Exceed Logo  with Mottto.png";

/** Public asset: public/Exceed Circle Logo.png */
export const EXCEED_CIRCLE_LOGO_SRC = "/Exceed Circle Logo.png";

export function ExceedCircleLogo({ className }: { className?: string }) {
  return (
    <Image
      src={EXCEED_CIRCLE_LOGO_SRC}
      alt="Exceed"
      width={44}
      height={44}
      className={cn(
        "size-11 shrink-0 rounded-full object-contain",
        className,
      )}
    />
  );
}

type ExceedLogoProps = {
  subtitle?: string;
  subtitleClassName?: string;
  imageClassName?: string;
  className?: string;
  priority?: boolean;
};

export function ExceedLogo({
  subtitle,
  subtitleClassName,
  imageClassName,
  className,
  priority = false,
}: ExceedLogoProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <Image
        src={EXCEED_LOGO_SRC}
        alt="Exceed Training Center"
        width={320}
        height={112}
        priority={priority}
        className={cn(
          "h-auto w-auto max-w-[160px] object-contain object-left",
          imageClassName,
        )}
      />
      {subtitle ? (
        <p
          className={cn(
            "mt-1 truncate text-xs text-gray-400",
            subtitleClassName,
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
