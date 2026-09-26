> **Status: historical background.** Jeremy's original notes, kept verbatim for provenance and moved to `docs/` on 2026-09-25. Every fact here is carried forward: hardware, location, refresh cadence, and the Codex working convention are in `README.md`; the display requirements and the decisions that later superseded them are in `docs/design-brief.md` §4 and §11. `example-designs/` is now `docs/example-designs/`. Where anything here conflicts with `design/spec.md`, the spec wins.

# ePaper Weather Station Project Context
## Goal
Create a display that shows the weather that I can put in my closet so I know what the weather will be like for the day. 

## Hardware
Purchased the RockBase NM-EPD-420-BW screen. Helpful links:
* Product page: https://rockbase.shop/en/products/nm-epd-420?variant=42529919762514
* Documentation from RockBase: https://wiki.rockbaseiot.com/docs/products/nm-epd-420/
* Github rep for NM-EPD-420: https://github.com/RockBase-iot/NM-EPD-420

## Building Agents
Software needed will be built and implemented using ChatGPT's Codex. Any plans should recommend which model to use for each task in the plan. 

## Desired data to see
* Current Outdoor weather 
    * Temp (in F)
    * Conditions (icon)
* Hourly forecast for next 6 hours
    * High/Low temp (in F)
    * Chance of Precipitaion (%) only show if not 0
    * Type of Prepcititation (icon) only show if not 0
    * Conditions (icon)
* Daily forecast for next 5 days
    * High/Low temp (in F)
    * Chance of Precipitaion (%) only show if not 0
    * Type of Prepcititation (icon) only show if not 0
    * Conditions (icon)
* Sunrise and Sunset time
    * Show next Sunrise or Sunset time using Civil Dawn or Civil Twilight
    * Formatted as H:MM AM/PM (e.g 9:45 PM)

## Refresh frequency
I would like the display to refresh every 30 minutes

## Location
Weather should all be for Marriott-Slaterville, UT 

## Design ideas 

### Examples of implementations I like
The subfoler `example-designs` has examples of epaper weather displays that I think look nice. None are perfect but should serve as examples. 

### Footer
I would like there to be a small footer to hold some information

#### Last update
The left should show the date and time of the last update. Formatted like `As of: m/d H:MM AM/PM` (e.g As of 9/24 4:58PM)

#### Logo
Design must incorporate my logo (found in ../personal-logo/final). I would like to be in the center of the footer

#### Location
Right of the footer should display the location the weather was pulled for. Formated like `City, State` (e.g. Marriott-Slaterville, UT)
