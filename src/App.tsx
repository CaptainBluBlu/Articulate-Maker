/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import CreatePage from './pages/CreatePage';
import PlayPage from './pages/PlayPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CreatePage />} />
          <Route path="play" element={<PlayPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
