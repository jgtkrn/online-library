// import {Process, Processor} from "@nestjs/bull";
// import {CategoryService} from "./categories.service";
// import {Job} from "bull";

// @Processor('freebie')
// export class FreebieProcessor {
//     constructor(private readonly categoryService: CategoryService) {}

//     @Process('insert')
//     async insertFreebie() {
//         await this.categoryService.insertFreebie();
//     }

//     @Process('removeExpiredFreebie')
//     async removeExpiredFreebie() {
//         await this.categoryService.removeExpiredFreebie();
//     }
// }
