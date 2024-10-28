import { act, cleanup, render } from '@testing-library/react'; // @testing-library/dom is needed as well as it is a peer dependency of @testing-library/react
import { describe, afterEach, it, expect } from 'vitest';
import { StyledEngineProvider } from '@mui/material/styles';

describe('App', () => {
  afterEach(cleanup);
  it('renders without crashing', async () => {
    const { getByDisplayValue } = render(
      <StyledEngineProvider injectFirst={true}>
        <input readOnly type="text" id="lastName" value="Admin" />
      </StyledEngineProvider>,
    );
    act(() => {
      const firstname = getByDisplayValue('Admin');
      expect(firstname).toBeDefined();
    });
  });
});
