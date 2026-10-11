import {NextResponse} from 'next/server';

export async function GET(request: Request){
  const url=new URL('/',request.url);
  const response=NextResponse.redirect(url,303);
  response.headers.set('Clear-Site-Data','"cache", "cookies", "storage", "executionContexts"');
  response.headers.set('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
  return response;
}
