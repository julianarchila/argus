import React from 'react';

interface ClickableLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const ClickableLink: React.FC<ClickableLinkProps> = ({ href, children, className }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    chrome.tabs.create({ url: href });
  };

  return (
    <a href={href} onClick={handleClick} className={className} style={{ cursor: 'pointer' }}>
      {children}
    </a>
  );
};

export default ClickableLink;
