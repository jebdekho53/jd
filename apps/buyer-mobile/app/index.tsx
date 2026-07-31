import { Redirect } from 'expo-router';

/** Guests and signed-in users both land on /home — browsing never requires
 *  login. Screens that do (checkout, orders, profile, ...) gate themselves
 *  via AuthGuard and redirect to /login only when actually needed.
 *
 *  Uses <Redirect> rather than router.replace() in a useEffect: the
 *  imperative call could fire before the root Stack navigator finished
 *  mounting ("Attempted to navigate before mounting the Root Layout
 *  component"), which <Redirect> avoids by hooking into the navigator's own
 *  ready state. */
export default function Index() {
  return <Redirect href="/home" />;
}
