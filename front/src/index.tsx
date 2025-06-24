/* @refresh reload */
import './index.css';

import { render } from 'solid-js/web';

import { Router } from '@solidjs/router';
import { Toaster } from 'solid-toast';
import routes from '~solid-pages';
import App from './app';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(
  () => <Router root={(props) => <App><Toaster position='top-center' toastOptions={{
    className: 'text-sm'
  }} />{props.children}</App>}>{routes}</Router>,
  root,
);
