import { IHttpOperationConfig, IHttpRequest, ProblemJsonError, UNPROCESSABLE_ENTITY } from '@stoplight/prism-http';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/lib/Decoder';
//@ts-ignore
import * as parsePreferHeader from 'parse-prefer-header';

const BooleanFromString = D.parse<string, boolean>(s =>
  s === 'true' ? D.success(true) : s === 'false' ? D.success(false) : D.failure(s, 'a boolean')
);

const IntegerFromString = D.parse<string, number>(s => {
  const value = Number(s);
  return Number.isInteger(value) ? D.success(value) : D.failure(s, 'an integer');
});

const PreferencesDecoder = D.partial({
  code: pipe(
    D.string,
    IntegerFromString,
    D.refine((n): n is number => n >= 100 && n <= 599, 'a http status code')
  ),
  delay: pipe(
    D.string,
    IntegerFromString,
    D.refine((n): n is number => n >= 0 && n <= 5000, 'a positive integer smaller than or equal to 5000')
  ),
  dynamic: pipe(D.string, BooleanFromString),
  example: D.string,
});

type RequestPreferences = Partial<Omit<IHttpOperationConfig, 'mediaType'>>;

export const getHttpConfigFromRequest = (
  req: Pick<IHttpRequest, 'headers' | 'url'>
): E.Either<ProblemJsonError, RequestPreferences> => {
  const preferences: unknown =
    req.headers && req.headers['prefer']
      ? parsePreferHeader(req.headers['prefer'])
      : { code: req.url.query?.__code, dynamic: req.url.query?.__dynamic, example: req.url.query?.__example };

  return pipe(
    PreferencesDecoder.decode(preferences),
    E.bimap(
      err => ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY, D.draw(err)),
      parsed => ({
        code: parsed?.code,
        delay: parsed?.delay,
        dynamic: parsed?.dynamic,
        exampleKey: parsed?.example,
      })
    )
  );
};
