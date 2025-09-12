import {
  HypersyncClient,
  Decoder,
  Query,
  JoinMode,
  LogField,
} from "npm:@envio-dev/hypersync-client";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";


const router = new Router();

router
  .get("/token/:address" , (context) => {
    const address = context.params.address;
    console.log('Token Address:' , address);
  })


const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 6666 });