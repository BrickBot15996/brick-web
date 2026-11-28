import { AppLink } from '../components/AppLink';
import { Icon } from '../components/icons';

/** The route points nowhere in the CMS. */
export function NotFound() {
  return (
    <div className="col">
      <h1 className="h1">Page not found</h1>
      <div className="holder">
        <p className="holder__lead">That address doesn’t lead anywhere in the CMS.</p>
        <AppLink href="/" className="link holder__back"><Icon name="arrow" className="i holder__arr" />Back to Home</AppLink>
      </div>
    </div>
  );
}

/** The member's permissions don't include what this module needs. */
export function NoAccess() {
  return (
    <div className="col">
      <h1 className="h1">You don’t have access to this</h1>
      <div className="holder">
        <p className="holder__lead">Your account doesn’t include this part of the CMS. Ask a team admin if you need it.</p>
        <AppLink href="/" className="link holder__back"><Icon name="arrow" className="i holder__arr" />Back to Home</AppLink>
      </div>
    </div>
  );
}
