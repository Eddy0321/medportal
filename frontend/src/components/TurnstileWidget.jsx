import * as React from 'react';

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export function TurnstileWidget({ onToken, onError }) {
  const containerRef = React.useRef(null);
  const widgetIdRef = React.useRef(null);

  const callbackRef = React.useRef(onToken);
  const errorRef = React.useRef(onError);

  React.useEffect(() => {
    callbackRef.current = onToken;
    errorRef.current = onError;
  }, [onToken, onError]);

  React.useEffect(() => {
    const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;

    if (!siteKey || !containerRef.current) {
      return;
    }

    let cancelled = false;

    const renderWidget = () => {
      if (
        cancelled ||
        !window.turnstile ||
        !containerRef.current ||
        widgetIdRef.current !== null
      ) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(
        containerRef.current,
        {
          sitekey: siteKey,

          appearance: 'interaction-only',

          callback: (token) => {
            callbackRef.current?.(token);
          },

          'expired-callback': () => {
            callbackRef.current?.('');
          },

          'error-callback': () => {
            errorRef.current?.();
          },
        }
      );
    };

    const existingScript = document.getElementById(
      TURNSTILE_SCRIPT_ID
    );

    if (existingScript) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existingScript.addEventListener('load', renderWidget);
      }
    } else {
      const script = document.createElement('script');

      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;

      script.addEventListener('load', renderWidget);

      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;

      if (
        widgetIdRef.current !== null &&
        window.turnstile
      ) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!process.env.REACT_APP_TURNSTILE_SITE_KEY) {
    return (
      <small>
        Turnstile is not configured. Payments are disabled until it is enabled.
      </small>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-label="Security verification"
    />
  );
}