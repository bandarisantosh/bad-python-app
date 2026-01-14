import { AUTH_CONFIG } from 'app/modules/session/auth0Config';
import { LocalStorageKeys } from 'app/shared/constants/localStorage';
import { merge, cloneDeep } from 'lodash';

import { store } from 'app/store/configureStore';
// Utils
import { consoleError, consoleWarn } from 'app/shared/utils/console';
import {
  getImpersonateId,
  getOrgSwitcherAgentId,
} from 'app/shared/utils/sessionStorage';
import { v4 } from 'uuid';

// Actions
import { sendToast, sendErrorToast } from 'app/shared/toasts/actions';

// Permission auditor
import { addPermission as addPermissions } from 'app/modules/devtools/sliceDevtools';
import getFromProcessEnv from 'app/shared/utils/getFromProcessEnv';

const PERMISSION_HEADER_NAME = 'u21-required-permissions';

export const UPLOAD_ABORTED_MESSAGE = 'Upload aborted';

const defaultOptions = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

function sendErrorToastIfMissingPermissions(response: Response) {
  try {
    const requiredPermissions = JSON.parse(
      response.headers.get('u21-required-permissions') || '[]',
    );

    if (response.status === 403 && requiredPermissions.length > 0) {
      const regex = /[:_]/gi;
      const formattedPermissions = requiredPermissions.map((permission) =>
        permission.replaceAll(regex, ' '),
      );

      store.dispatch(
        sendErrorToast(
          `Missing required permissions. Please ask an administrator to ensure you have all of the following permissions: ${formattedPermissions.join(
            ', ',
          )}.`,
        ),
      );

      consoleError(
        `${response.url.replace(window.location.origin, '')} missing required permissions`,
        { permissions: requiredPermissions },
      );
    }
  } catch (e) {
    // Ignore exception
  }
}

function checkStatus(response: Response): Promise<Response | null> {
  // 204 is no content. return null to trigger the the next 'then' condition

  if (response.status === 204) {
    return Promise.resolve(null);
  }

  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  }

  consoleWarn(
    `HTTP ${response.status} accessing "${response.url}". See the full Response object below:`,
  );

  sendErrorToastIfMissingPermissions(response);

  return Promise.reject(response);
}

function generateQueryParamString(
  queryParams: { key: string; value: string }[],
): string {
  const resArr: string[] = [];
  queryParams.forEach(({ key, value }) => resArr.push(`${key}=${value}`));

  const res = resArr.join('&');
  return res ? `?${res}` : '';
}

function sendPermissionsToAuditor(header: string | null) {
  if (
    header === null ||
    window.sessionStorage.getItem('permissionsAuditor') !== 'true'
  ) {
    return;
  }
  const requiredPermissions = JSON.parse(header);
  store.dispatch(addPermissions(requiredPermissions));
}

const fetchr = async <ResponseType = unknown>(
  endpoint: string,
  queryParams: { key: string; value: string }[] = [],
  customOptions = defaultOptions,
  json = true,
  overwriteBaseUrl = false,
): Promise<ResponseType> => {
  const accessToken = localStorage.getItem(LocalStorageKeys.ACCESS_TOKEN);
  const options: any = cloneDeep(customOptions);
  options.headers.Authorization = `Bearer ${accessToken}`;
  options.headers.RequestID = v4();

  // Allow root users (i.e. u21-internal) to specify a user id to impersonate as
  const orgSwitcherId: number | null = getOrgSwitcherAgentId();
  const impersonateId: number | null = getImpersonateId();
  if (impersonateId && impersonateId >= 0) {
    options.headers['impersonate-as'] = impersonateId;
  } else if (orgSwitcherId && orgSwitcherId >= 0) {
    options.headers['org-switch-as'] = orgSwitcherId;
  }
  const base = overwriteBaseUrl ? '' : AUTH_CONFIG.apiBaseUrl;
  return fetch(
    `${base}${endpoint}${generateQueryParamString(queryParams)}`,
    options,
  )
    .then(checkStatus)
    .then((res) => {
      if (res) {
        sendPermissionsToAuditor(res.headers.get(PERMISSION_HEADER_NAME));
        return json ? res.json() : res.text();
      }
      return {};
    }) as ResponseType;
};

export const getFileDownloadResponse = async (
  endpoint: string,
  method: string = 'GET',
  body: JSONObject = {},
): Promise<Response> => {
  const accessToken = localStorage.getItem(LocalStorageKeys.ACCESS_TOKEN);
  const options: any = cloneDeep(defaultOptions);
  options.method = method;
  options.headers.Authorization = `Bearer ${accessToken}`;
  options.headers.RequestID = v4();

  if (method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  // Allow root users (i.e. u21-internal) to specify a user id to impersonate as
  const impersonateId: number | null = getImpersonateId();
  const orgSwitcherId: number | null = getOrgSwitcherAgentId();
  if (impersonateId && impersonateId >= 0) {
    options.headers['impersonate-as'] = impersonateId;
  } else if (orgSwitcherId && orgSwitcherId >= 0) {
    options.headers['org-switch-as'] = orgSwitcherId;
  }

  return fetch(`${AUTH_CONFIG.apiBaseUrl}${endpoint}`, options);
};

export const downloadFile = async (
  endpoint: string,
  fileName: string,
  method: string = 'GET',
  body: JSONObject = {},
) => {
  const accessToken = localStorage.getItem(LocalStorageKeys.ACCESS_TOKEN);
  const options: any = cloneDeep(defaultOptions);
  options.method = method;
  options.headers.Authorization = `Bearer ${accessToken}`;
  options.headers.RequestID = v4();

  if (method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  // Allow root users (i.e. u21-internal) to specify a user id to impersonate as
  const impersonateId: number | null = getImpersonateId();
  const orgSwitcherId: number | null = getOrgSwitcherAgentId();
  if (impersonateId && impersonateId >= 0) {
    options.headers['impersonate-as'] = impersonateId;
  } else if (orgSwitcherId && orgSwitcherId >= 0) {
    options.headers['org-switch-as'] = orgSwitcherId;
  }

  return fetch(`${AUTH_CONFIG.apiBaseUrl}${endpoint}`, options)
    .then(checkStatus)
    .then((res: any) => {
      if (res) {
        sendPermissionsToAuditor(res.headers.get(PERMISSION_HEADER_NAME));
        res
          .blob()
          .then((blob) => {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
          })
          .catch((error) => {
            sendToast({
              message: error,
              position: 'Top',
              type: 'Error',
            });
            throw new Error(`Error occurred:${error}`);
          });
      }
      return {};
    });
};

export function get<ResponseType = unknown>(
  endpoint: string,
  queryParams: { key: string; value: string }[] = [],
  config = {},
) {
  const options: any = merge(cloneDeep(defaultOptions), { ...config });
  options.method = 'GET';

  return fetchr<ResponseType>(endpoint, queryParams, options);
}

export function post<ResponseType = unknown>(
  endpoint: string,
  body = {},
  queryParams: { key: string; value: string }[] = [],
  config = {},
) {
  const options: any = merge(cloneDeep(defaultOptions), { ...config });
  options.method = 'POST';
  options.body = JSON.stringify(body);

  return fetchr<ResponseType>(endpoint, queryParams, options);
}

export function put<ResponseType = unknown>(
  endpoint: string,
  body = {},
  config = {},
) {
  const options: any = merge(cloneDeep(defaultOptions), { ...config });
  options.method = 'PUT';
  options.body = JSON.stringify(body);

  return fetchr<ResponseType>(endpoint, [], options);
}

export function patch<ResponseType = unknown>(
  endpoint: string,
  body = {},
  config = {},
) {
  const options: any = merge(cloneDeep(defaultOptions), { ...config });
  options.method = 'PATCH';
  options.body = JSON.stringify(body);

  return fetchr<ResponseType>(endpoint, [], options);
}

export function destroy<ResponseType = unknown>(endpoint: string, config = {}) {
  const options: any = merge(cloneDeep(defaultOptions), { ...config });
  options.method = 'DELETE';

  return fetchr<ResponseType>(endpoint, [], options);
}

const getUploadHeaders = async () => {
  const accessToken = localStorage.getItem(LocalStorageKeys.ACCESS_TOKEN);

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    RequestID: v4(),
  };

  // Allow root users (i.e. u21-internal) to specify a user id to impersonate as
  const impersonateId: number | null = getImpersonateId();
  const orgSwitcherId: number | null = getOrgSwitcherAgentId();
  if (impersonateId && impersonateId >= 0) {
    headers['impersonate-as'] = impersonateId;
  } else if (orgSwitcherId && orgSwitcherId >= 0) {
    headers['org-switch-as'] = orgSwitcherId;
  }

  return headers;
};

export const upload = async (endpoint: string, body: FormData) => {
  const headers = await getUploadHeaders();

  return fetch(`${AUTH_CONFIG.apiBaseUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body,
  }).then((response) => {
    sendPermissionsToAuditor(response.headers.get(PERMISSION_HEADER_NAME));
    if (response.status !== 200) {
      return Promise.reject(response);
    }
    return response.json();
  });
};

export const uploadWithProgress = (endpoint: string, body: FormData) => {
  // This function cannot be async because we want to return the XHR object immediately

  const req = new XMLHttpRequest();
  const uploadPromise = new Promise<any>((resolve, reject) => {
    req.open('POST', `${AUTH_CONFIG.apiBaseUrl}${endpoint}`);
    req.withCredentials = true;

    req.addEventListener('readystatechange', () => {
      if (req.readyState !== XMLHttpRequest.DONE) {
        return;
      }

      // If there's no status,
      // it means we never got a response from the server
      if (req.status === 0) {
        reject(new Error(UPLOAD_ABORTED_MESSAGE));
      } else if (req.status !== 200) {
        sendPermissionsToAuditor(req.getResponseHeader(PERMISSION_HEADER_NAME));
        let response = 'Could not parse the response';
        try {
          response = JSON.parse(req.responseText);
        } catch {}

        reject(response);
      } else {
        resolve(JSON.parse(req.responseText));
      }
    });

    // Since this function cannot be async
    // we use .then() here to add the headers before we send off the request
    getUploadHeaders().then((headers) => {
      for (const [key, value] of Object.entries(headers)) {
        req.setRequestHeader(key, value);
      }
      req.send(body);
    });
  });

  return { req, uploadPromise };
};

const TOKENIZATION_SERVICE_URL = `https://${
  process.env.NODE_ENV === 'test'
    ? 'tokenization-service.com'
    : getFromProcessEnv('TOKENIZATION_SERVICE_URL')
}`;

export const decryptPan = async (token: string) => {
  const options: any = cloneDeep(defaultOptions);
  options.method = 'GET';
  return fetchr<ResponseType>(
    `${TOKENIZATION_SERVICE_URL}/${token}`,
    undefined,
    options,
    undefined,
    true,
  );
};
