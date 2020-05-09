import { lowerKeysDeep } from "./utils";

it("lowerKeysDeep", () => {
  expect(
    lowerKeysDeep({
      One: 1,
      Two: 2,
      Object: {
        Three: 3,
        DeepObject: {
          Four: 4,
          Five: 5
        }
      }
    })
  ).toEqual({
    one: 1,
    two: 2,
    object: {
      three: 3,
      deepObject: {
        four: 4,
        five: 5
      }
    }
  });
});
