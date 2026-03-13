import React from "react";

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

const IonIcon = ({ name, size = 24, className = "", style = {} }: IonIconProps) => {
  return (
    <ion-icon
      name={name}
      className={className}
      style={{
        fontSize: `${size}px`,
        ...style,
      }}
    />
  );
};

export default IonIcon;
