import React, { memo, forwardRef } from "react";

interface IonIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { name?: string; size?: string },
        HTMLElement
      >;
    }
  }
}

const IonIcon = memo(
  forwardRef<HTMLElement, IonIconProps>(
    ({ name, size = 24, className = "", style = {} }, ref) => {
      return (
        <ion-icon
          ref={ref as any}
          name={name}
          className={className}
          style={{
            fontSize: `${size}px`,
            ...style,
          }}
        />
      );
    }
  )
);

IonIcon.displayName = "IonIcon";

export default IonIcon;
