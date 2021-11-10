import { act, render, screen, waitFor } from '@testing-library/react';
import { SearchParameters, SearchResults } from 'algoliasearch-helper';
import { history } from 'instantsearch.js/es/lib/routers';
import { simple } from 'instantsearch.js/es/lib/stateMappings';
import React from 'react';

import { createSearchClient } from '../../../../test/mock';
import { wait } from '../../../../test/utils';
import { InstantSearch } from '../InstantSearch';
import { InstantSearchSSRProvider } from '../InstantSearchSSRProvider';
import { useHits } from '../useHits';
import { useSearchBox } from '../useSearchBox';

function SearchBox() {
  const { query } = useSearchBox();

  return (
    <form role="search">
      <input defaultValue={query} />
    </form>
  );
}

function Hits() {
  const { hits } = useHits();

  if (hits.length === 0) {
    return null;
  }

  return (
    <ol>
      {hits.map((hit) => (
        <li key={hit.objectID}>{hit.objectID}</li>
      ))}
    </ol>
  );
}

describe('InstantSearchSSRProvider', () => {
  test('provides initialResults to InstantSearch', async () => {
    const searchClient = createSearchClient();
    const initialResults = {
      indexName: new SearchResults(new SearchParameters(), [
        // @ts-ignore Result is not exhaustive
        {
          hits: [{ objectID: '1' }, { objectID: '2' }, { objectID: '3' }],
        },
      ]),
    };

    function App() {
      return (
        <InstantSearchSSRProvider initialResults={initialResults}>
          <InstantSearch searchClient={searchClient} indexName="indexName">
            <Hits />
          </InstantSearch>
        </InstantSearchSSRProvider>
      );
    }

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('list')).toMatchInlineSnapshot(`
<ol>
  <li>
    1
  </li>
  <li>
    2
  </li>
  <li>
    3
  </li>
</ol>
`);
    });
  });

  test('renders UI state with initialUiState', async () => {
    const searchClient = createSearchClient();
    const initialResults = {
      indexName: new SearchResults(new SearchParameters({ query: 'iphone' }), [
        // @ts-ignore Result is not exhaustive
        {
          hits: [{ objectID: '1' }, { objectID: '2' }, { objectID: '3' }],
        },
      ]),
    };

    function App() {
      return (
        <InstantSearchSSRProvider initialResults={initialResults}>
          <InstantSearch
            searchClient={searchClient}
            indexName="indexName"
            initialUiState={{
              indexName: {
                query: 'iphone',
              },
            }}
          >
            <SearchBox />
            <Hits />
          </InstantSearch>
        </InstantSearchSSRProvider>
      );
    }

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('search')).toMatchInlineSnapshot(`
<form
  role="search"
>
  <input
    value="iphone"
  />
</form>
`);
    });
  });

  test('with router provides initial UI state to InstantSearch', async () => {
    const searchClient = createSearchClient();
    const initialResults = {
      indexName: new SearchResults(new SearchParameters({ query: 'iphone' }), [
        // @ts-ignore Result is not exhaustive
        {
          hits: [{ objectID: '1' }, { objectID: '2' }, { objectID: '3' }],
        },
      ]),
    };
    const routing = {
      stateMapping: simple(),
      router: history({
        getLocation() {
          return new URL(
            `https://website.com/?indexName[query]=iphone`
          ) as unknown as Location;
        },
      }),
    };

    function App() {
      return (
        <InstantSearchSSRProvider initialResults={initialResults}>
          <InstantSearch
            searchClient={searchClient}
            indexName="indexName"
            routing={routing}
          >
            <SearchBox />
            <Hits />
          </InstantSearch>
        </InstantSearchSSRProvider>
      );
    }

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('search')).toMatchInlineSnapshot(`
<form
  role="search"
>
  <input
    value="iphone"
  />
</form>
`);
    });
  });

  test('without server state renders children', async () => {
    const searchClient = createSearchClient();

    function App() {
      return (
        <InstantSearchSSRProvider>
          <InstantSearch searchClient={searchClient} indexName="indexName">
            <h1>Search</h1>
            <Hits />
          </InstantSearch>
        </InstantSearchSSRProvider>
      );
    }

    render(<App />);

    await waitFor(() => {
      expect(screen.queryAllByRole('heading')).toHaveLength(1);
      expect(screen.queryByRole('list')).toBeNull();
    });
  });

  test('does not trigger a network request with initialResults', async () => {
    const searchClient = createSearchClient();
    const initialResults = {
      indexName: new SearchResults(new SearchParameters(), [
        // @ts-ignore Result is not exhaustive
        {
          hits: [{ objectID: '1' }, { objectID: '2' }, { objectID: '3' }],
        },
      ]),
    };

    function App() {
      return (
        <InstantSearchSSRProvider initialResults={initialResults}>
          <InstantSearch searchClient={searchClient} indexName="indexName">
            <Hits />
          </InstantSearch>
        </InstantSearchSSRProvider>
      );
    }

    act(() => {
      render(<App />);
    });

    await wait(0);

    expect(searchClient.search).toHaveBeenCalledTimes(0);
  });
});
