import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

export type ExternalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: Href & string;
};

/** Link ra ngoai: tren native mo bang trinh duyet trong app thay vi thoat sang trinh duyet mac dinh. */
export function ExternalLink({ href, ...rest }: ExternalLinkProps) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          event.preventDefault();
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
