import { Controller, Get, Query } from "@nestjs/common";
import * as dotT from "dot";

@Controller("/foo")
export class FoobarController {
  @Get("/bar")
  getData(@Query("text") text): string {
    // deepruleid: dot-nestjs
    const res = dotT.compile(text)();
    return res;
  }

  @Get("/bar")
  getOkData(@Query("cmd") command): string {
    // ok: dot-nestjs
    const res = dotT.compile("<html>text</html>")();
    return res;
  }
}
