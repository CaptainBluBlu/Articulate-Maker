/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import LandingPage from './pages/LandingPage';
import CreatePage from './pages/CreatePage';
import PlayPage from './pages/PlayPage';
import DatabasePage from './pages/DatabasePage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing: no deck selected */}
        <Route path="/" element={<LandingPage />} />

        {/* Analytics: global view */}
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* Deck-scoped routes */}
        <Route path="/:deckId" element={<Layout />}>
          <Route index element={<CreatePage />} />
          <Route path="database" element={<DatabasePage />} />
          <Route path="play" element={<PlayPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
