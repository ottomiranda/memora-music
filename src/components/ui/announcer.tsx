import React from 'react';

const AnnouncerComponent = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div
    ref={ref}
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
    role="status"
  />
));

AnnouncerComponent.displayName = 'AnnouncerComponent';

export const Announcer = React.memo(AnnouncerComponent);
Announcer.displayName = 'Announcer';