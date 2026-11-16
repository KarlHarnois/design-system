fn main_body() -> Result<(), String> {
    let values = {
        fn refuse(message: String, usage: &str) -> ! {
            eprintln!("error: {}\nusage: {}", message, usage);
            std::process::exit(2)
        }
        fn counted(count: usize) -> String {
            if count == 1 {
                "1 positional argument".to_string()
            } else {
                format!("{} positional arguments", count)
            }
        }
        fn flag_name(word: &str) -> Option<&str> {
            word.strip_prefix("--")
                .map(|written| written.split_once('=').map_or(written, |(name, _)| name))
        }
        let task: &str = "build-grid";
        let positional_count: usize = 0_usize;
        let flags: Vec<&str> = "".split_whitespace().collect();
        let switches: Vec<&str> = "".split_whitespace().collect();
        let usage: &str = "build-grid";
        let written: Vec<&str> =
            "Writes the grid stylesheet, its fonts and the overlay into dist/grid/."
                .lines()
                .collect();
        let margin = written
            .iter()
            .skip(1)
            .filter(|line| !line.trim().is_empty())
            .map(|line| line.len() - line.trim_start().len())
            .min()
            .unwrap_or(0);
        let documentation: String = written
            .iter()
            .enumerate()
            .map(|(index, line)| {
                if index == 0 {
                    line.trim()
                } else {
                    line.get(margin..).unwrap_or_else(|| line.trim())
                }
            })
            .collect::<Vec<_>>()
            .join("\n");
        let mut values: Vec<Option<String>> =
            vec![None; positional_count + flags.len() + switches.len()];
        let mut positional = 0;
        let mut flags_ended = false;
        let mut last_switch: Option<String> = None;
        let mut words = std::env::args().skip(1).peekable();
        while let Some(word) = words.next() {
            let after_switch = last_switch.take();
            if !flags_ended && word == "--" {
                flags_ended = true;
            } else if !flags_ended && word == "--help" {
                println!("usage: {}", usage);
                if !documentation.is_empty() {
                    println!("\n{}", documentation);
                }
                std::process::exit(0)
            } else if let Some(written) = word.strip_prefix("--").filter(|_| !flags_ended) {
                let (name, attached) = match written.split_once('=') {
                    Some((name, value)) => (name, Some(value.to_string())),
                    None => (written, None),
                };
                let (slot, value) =
                    if let Some(index) = switches.iter().position(|switch| *switch == name) {
                        if attached.is_some() {
                            refuse(format!("switch `--{}` takes no value", name), usage)
                        }
                        last_switch = Some(name.to_string());
                        (positional_count + flags.len() + index, String::new())
                    } else if let Some(index) = flags.iter().position(|flag| *flag == name) {
                        let names_a_flag = words
                            .peek()
                            .and_then(|next| flag_name(next))
                            .is_some_and(|next| {
                                next == "help" || flags.contains(&next) || switches.contains(&next)
                            });
                        if attached.is_none() && names_a_flag {
                            refuse(format!("flag `--{}` needs a value", name), usage)
                        }
                        let value = attached.or_else(|| words.next()).unwrap_or_else(|| {
                            refuse(format!("flag `--{}` needs a value", name), usage)
                        });
                        (positional_count + index, value)
                    } else {
                        refuse(format!("task `{}` has no flag `--{}`", task, name), usage)
                    };
                if values[slot].is_some() {
                    refuse(format!("flag `--{}` is given more than once", name), usage)
                }
                values[slot] = Some(value);
            } else if positional < positional_count {
                values[positional] = Some(word);
                positional += 1;
            } else if let Some(switch) = after_switch {
                refuse(format!("switch `--{}` takes no value", switch), usage)
            } else {
                refuse(
                    format!(
                        "task `{}` takes {}, and got more",
                        task,
                        counted(positional_count)
                    ),
                    usage,
                )
            }
        }
        if positional < positional_count {
            refuse(
                format!(
                    "task `{}` takes {}, and got {}",
                    task,
                    counted(positional_count),
                    positional
                ),
                usage,
            )
        }
        values
    };
    crate::build_grid::task_build_grid()
}

fn main() {
    crate::rt::restore_default_sigpipe();
    if let Err(error) = main_body() {
        eprintln!("{}", error);
        std::process::exit(1);
    }
}

mod build_grid {
    const OUTPUT_DIRECTORY: &str = "../dist/grid";

    pub(crate) fn task_build_grid() -> Result<(), String> {
        let grid = crate::design_grid::design_grid().map_err(
            |argument: crate::knave_grid::check::problems::GridError| error_text(&argument),
        )?;
        crate::knave_grid::output::write_grid(&grid, output_path("grid.css").as_str()).map_err(
            |argument: crate::knave_grid::check::problems::GridError| error_text(&argument),
        )?;
        std::fs::write(
            output_path("grid-overlay.css").as_str(),
            crate::knave_grid::overlay::OVERLAY_CSS,
        )
        .map_err(|error| error.to_string())
    }

    fn output_path(file_name: &str) -> String {
        format!("{}/{}", OUTPUT_DIRECTORY, file_name)
    }

    fn error_text(error: &crate::knave_grid::check::problems::GridError) -> String {
        error.to_string()
    }
}

mod design_grid {
    pub fn design_grid() -> Result<
        crate::knave_grid::check::grid::CheckedGrid,
        crate::knave_grid::check::problems::GridError,
    > {
        let mono = crate::knave_grid::font::family::read_declared_family(
            "/nix/store/g6vxg8lxzs76v349vc0azw7v4lqg7dkq-design-system-web-fonts",
            "Iosevka",
            vec![
                crate::knave_grid::font::family::make_declared_file(
                    "bold".to_string(),
                    "iosevka-bold.woff2".to_string(),
                ),
                crate::knave_grid::font::family::make_declared_file(
                    "regular".to_string(),
                    "iosevka-regular.woff2".to_string(),
                ),
            ],
        )
        .map_err(|error: crate::knave_grid::font::tables::FontError| {
            crate::knave_grid::check::problems::GridError::UnusableFont { error: error }
        })?;
        let prose = crate::knave_grid::font::family::read_declared_family(
            "/nix/store/g6vxg8lxzs76v349vc0azw7v4lqg7dkq-design-system-web-fonts",
            "Iosevka Aile",
            vec![crate::knave_grid::font::family::make_declared_file(
                "regular".to_string(),
                "iosevka-aile-regular.woff2".to_string(),
            )],
        )
        .map_err(|error: crate::knave_grid::font::tables::FontError| {
            crate::knave_grid::check::problems::GridError::UnusableFont { error: error }
        })?;
        crate::knave_grid::check::grid::check_grid(crate::knave_grid::spec::grid_spec::GridSpec {
            body_type: crate::knave_grid::spec::body_type::BodyType {
                font_family: mono,
                size: 14.0,
                line_height: 1.5,
                weight: "regular".to_string(),
            },
            type_areas: vec![
                crate::knave_grid::spec::type_area::TypeArea {
                    name: "narrow".to_string(),
                    width: 23,
                    column_count: 4,
                    margin: 1,
                    field_lines: Some(4),
                    gutter: 1,
                    head: 2,
                    foot: 2,
                    measure_columns: None,
                    field_gap: 1,
                },
                crate::knave_grid::spec::type_area::TypeArea {
                    name: "medium".to_string(),
                    width: 31,
                    column_count: 4,
                    margin: 1,
                    field_lines: Some(4),
                    gutter: 1,
                    head: 2,
                    foot: 2,
                    measure_columns: None,
                    field_gap: 1,
                },
                crate::knave_grid::spec::type_area::TypeArea {
                    name: "wide".to_string(),
                    width: 47,
                    column_count: 6,
                    margin: 2,
                    field_lines: Some(4),
                    gutter: 1,
                    head: 2,
                    foot: 2,
                    measure_columns: None,
                    field_gap: 1,
                },
            ],
            type_styles: vec![
                crate::knave_grid::spec::type_style::TypeStyle {
                    name: "display".to_string(),
                    lines: 4,
                    weight: Some("bold".to_string()),
                    size: Some(84.0),
                    font_family: None,
                    baseline_line: None,
                    selector: None,
                },
                crate::knave_grid::spec::type_style::TypeStyle {
                    name: "h1".to_string(),
                    lines: 3,
                    weight: Some("bold".to_string()),
                    size: None,
                    font_family: None,
                    baseline_line: None,
                    selector: None,
                },
                crate::knave_grid::spec::type_style::TypeStyle {
                    name: "h2".to_string(),
                    lines: 2,
                    weight: Some("bold".to_string()),
                    size: None,
                    font_family: None,
                    baseline_line: None,
                    selector: None,
                },
                crate::knave_grid::spec::type_style::TypeStyle {
                    name: "h3".to_string(),
                    lines: 1,
                    weight: Some("bold".to_string()),
                    size: Some(18.0),
                    baseline_line: Some(1),
                    font_family: None,
                    selector: None,
                },
                crate::knave_grid::spec::type_style::TypeStyle {
                    name: "label".to_string(),
                    lines: 1,
                    weight: Some("bold".to_string()),
                    baseline_line: Some(1),
                    size: None,
                    font_family: None,
                    selector: None,
                },
                crate::knave_grid::spec::type_style::TypeStyle {
                    name: "prose".to_string(),
                    lines: 1,
                    weight: Some("regular".to_string()),
                    font_family: Some(prose),
                    baseline_line: Some(1),
                    size: None,
                    selector: None,
                },
                crate::knave_grid::spec::type_style::TypeStyle {
                    name: "ui-small".to_string(),
                    lines: 1,
                    weight: Some("regular".to_string()),
                    size: Some(12.0),
                    baseline_line: Some(1),
                    font_family: None,
                    selector: None,
                },
            ],
        })
    }
}

mod knave_grid {

    pub(crate) mod browser {
        pub const DEFAULT_FONT_SIZE_PX: f64 = 16.0;
    }

    pub(crate) mod check {

        pub(crate) mod fields {
            pub fn check_fields(
                layout: &crate::knave_grid::spec::layout::Layout,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                let type_area = &layout.type_area;
                match type_area.field_lines {
                    Some(lines) => {
                        if lines < 1 || type_area.field_gap < 0 {
                            Err(
                                crate::knave_grid::check::problems::GridError::FieldsTooSmall {
                                    layout: crate::knave_grid::spec::layout::layout_label(layout),
                                    lines: lines,
                                    gap: type_area.field_gap,
                                },
                            )
                        } else {
                            Ok(())
                        }
                    }
                    None => Ok(()),
                }
            }
        }

        pub(crate) mod font_weights {
            pub fn check_font_weights(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                let body = &spec.body_type;
                check_weight(
                    "the body".to_string(),
                    &body.font_family,
                    body.weight.as_str(),
                )?;
                check_body_zero(body)?;
                check_styles(spec, 0)
            }

            fn check_body_zero(
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                match crate::knave_grid::spec::body_type::body_metrics(body).zero_width {
                    Some(_) => Ok(()),
                    None => Err(
                        crate::knave_grid::check::problems::GridError::BodyFontWithoutZero {
                            family: body.font_family.name.clone(),
                        },
                    ),
                }
            }

            fn check_styles(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                mut index: usize,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                loop {
                    if index >= spec.type_styles.len() {
                        return Ok(());
                    } else {
                        check_style(spec, &spec.type_styles[index])?;
                        index += 1;
                        continue;
                    }
                }
            }

            fn check_style(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                style: &crate::knave_grid::spec::type_style::TypeStyle,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                let body = &spec.body_type;
                let owner = format!("the type style {}", style.name);
                let family = match &style.font_family {
                    Some(family) => family,
                    None => &body.font_family,
                };
                let weight = match &style.weight {
                    Some(name) => name.clone(),
                    None => body.weight.clone(),
                };
                check_weight(owner, family, weight.as_str())
            }

            fn check_weight(
                owner: String,
                family: &crate::knave_grid::font::family::FontFamily,
                weight: &str,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                match crate::knave_grid::font::weight::weight_number(weight) {
                    Some(number) => {
                        if crate::knave_grid::font::family::is_has_weight(family, number) {
                            Ok(())
                        } else {
                            Err(
                                crate::knave_grid::check::problems::GridError::MissingFontWeight {
                                    owner: owner,
                                    family: family.name.clone(),
                                    weight: weight.to_string(),
                                },
                            )
                        }
                    }
                    None => Err(
                        crate::knave_grid::check::problems::GridError::UnknownFontWeight {
                            owner: owner,
                            weight: weight.to_string(),
                        },
                    ),
                }
            }
        }

        pub(crate) mod grid {
            #[derive(Clone, PartialEq)]
            pub struct CheckedGrid {
                pub spec: crate::knave_grid::spec::grid_spec::GridSpec,
                pub layouts: Vec<crate::knave_grid::spec::layout::Layout>,
                pub warnings: Vec<crate::knave_grid::check::warnings::GridWarning>,
            }

            fn make_checked_grid(
                spec: crate::knave_grid::spec::grid_spec::GridSpec,
                layouts: Vec<crate::knave_grid::spec::layout::Layout>,
                warnings: Vec<crate::knave_grid::check::warnings::GridWarning>,
            ) -> CheckedGrid {
                CheckedGrid {
                    spec,
                    layouts,
                    warnings,
                }
            }

            pub fn check_grid(
                spec: crate::knave_grid::spec::grid_spec::GridSpec,
            ) -> Result<CheckedGrid, crate::knave_grid::check::problems::GridError> {
                if spec.type_areas.is_empty() {
                    Err(crate::knave_grid::check::problems::GridError::NoTypeArea)
                } else {
                    let all = crate::knave_grid::spec::layout::layouts(&spec);
                    crate::knave_grid::check::font_weights::check_font_weights(&spec)?;
                    crate::knave_grid::check::square::check_square(&spec.body_type)?;
                    check_layouts(&all, 0)?;
                    crate::knave_grid::check::measure::check_measure(&spec, &all)?;
                    crate::knave_grid::check::type_styles::check_type_styles(&spec, 0)?;
                    let warnings = crate::knave_grid::check::measure::measure_warnings(&spec, &all);
                    Ok(make_checked_grid(spec, all, warnings))
                }
            }

            fn check_layouts(
                all: &[crate::knave_grid::spec::layout::Layout],
                mut index: usize,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                loop {
                    if index >= all.len() {
                        return Ok(());
                    } else {
                        check_layout(all, index)?;
                        index += 1;
                        continue;
                    }
                }
            }

            fn check_layout(
                all: &[crate::knave_grid::spec::layout::Layout],
                index: usize,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                let layout = &all[index];
                let type_area = &layout.type_area;
                if !crate::knave_grid::spec::type_area::is_fits(type_area) {
                    Err(
                        crate::knave_grid::check::problems::GridError::TypeAreaDoesNotFit {
                            layout: crate::knave_grid::spec::layout::layout_label(layout),
                            type_area: type_area.clone(),
                            fitting_counts:
                                crate::knave_grid::spec::type_area::fitting_column_counts(type_area),
                        },
                    )
                } else if is_name_taken(all, index) {
                    Err(
                        crate::knave_grid::check::problems::GridError::TypeAreaNameRepeated {
                            name: type_area.name.clone(),
                        },
                    )
                } else if is_out_of_order(all, index) {
                    let previous = &all[index - 1];
                    Err(
                        crate::knave_grid::check::problems::GridError::TypeAreasOutOfOrder {
                            name: type_area.name.clone(),
                            min_width_em: layout.min_width_em,
                            previous_name: previous.type_area.name.clone(),
                            previous_em: previous.min_width_em,
                        },
                    )
                } else {
                    crate::knave_grid::check::page_margins::check_page_margins(type_area)?;
                    crate::knave_grid::check::fields::check_fields(layout)
                }
            }

            fn is_name_taken(
                all: &[crate::knave_grid::spec::layout::Layout],
                index: usize,
            ) -> bool {
                let owner = &all[index];
                let name = &owner.type_area.name;
                all.iter()
                    .take(index)
                    .any(|earlier: &crate::knave_grid::spec::layout::Layout| {
                        earlier.type_area.name == *name
                    })
            }

            fn is_out_of_order(
                all: &[crate::knave_grid::spec::layout::Layout],
                index: usize,
            ) -> bool {
                index >= 2 && all[index].min_width_em <= all[index - 1].min_width_em
            }
        }

        pub(crate) mod measure {
            pub fn check_measure(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                all: &[crate::knave_grid::spec::layout::Layout],
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                match all
                    .iter()
                    .find(|layout: &&crate::knave_grid::spec::layout::Layout| {
                        !is_columns_within(spec, layout)
                    }) {
                    Some(layout) => Err(
                        crate::knave_grid::check::problems::GridError::MeasureColumnsOutside {
                            layout: crate::knave_grid::spec::layout::layout_label(layout),
                            columns: layout_columns(spec, layout),
                            column_count: layout.type_area.column_count,
                        },
                    ),
                    None => Ok(()),
                }
            }

            fn is_columns_within(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                layout: &crate::knave_grid::spec::layout::Layout,
            ) -> bool {
                let columns: i64 = layout_columns(spec, layout);
                columns >= 1 && columns <= layout.type_area.column_count
            }

            pub fn measure_warnings(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                all: &[crate::knave_grid::spec::layout::Layout],
            ) -> Vec<crate::knave_grid::check::warnings::GridWarning> {
                all.iter()
                    .filter(|layout: &&crate::knave_grid::spec::layout::Layout| {
                        !is_readable_layout(spec, layout)
                    })
                    .map(|layout: &crate::knave_grid::spec::layout::Layout| {
                        measure_warning(spec, layout)
                    })
                    .collect::<Vec<_>>()
            }

            fn is_readable_layout(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                layout: &crate::knave_grid::spec::layout::Layout,
            ) -> bool {
                let characters = layout_characters(spec, layout);
                characters >= crate::knave_grid::check::warnings::NARROWEST_MEASURE_CH
                    && characters <= crate::knave_grid::check::warnings::WIDEST_MEASURE_CH
            }

            fn measure_warning(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                layout: &crate::knave_grid::spec::layout::Layout,
            ) -> crate::knave_grid::check::warnings::GridWarning {
                crate::knave_grid::check::warnings::GridWarning::MeasureOutOfRange {
                    layout: crate::knave_grid::spec::layout::layout_label(layout),
                    columns: layout_columns(spec, layout),
                    characters: layout_characters(spec, layout),
                }
            }

            fn layout_columns(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                layout: &crate::knave_grid::spec::layout::Layout,
            ) -> i64 {
                crate::knave_grid::spec::measure::measure_columns(
                    &layout.type_area,
                    &spec.body_type,
                )
            }

            fn layout_characters(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                layout: &crate::knave_grid::spec::layout::Layout,
            ) -> f64 {
                crate::knave_grid::spec::measure::measure_characters(
                    &layout.type_area,
                    &spec.body_type,
                )
            }
        }

        pub(crate) mod page_margins {
            pub fn check_page_margins(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                if type_area.head < 1 {
                    Err(
                        crate::knave_grid::check::problems::GridError::PageMarginTooSmall {
                            edge: "head".to_string(),
                            squares: type_area.head,
                        },
                    )
                } else if type_area.foot < 1 {
                    Err(
                        crate::knave_grid::check::problems::GridError::PageMarginTooSmall {
                            edge: "foot".to_string(),
                            squares: type_area.foot,
                        },
                    )
                } else {
                    Ok(())
                }
            }
        }

        pub(crate) mod problems {
            #[derive(Clone, PartialEq)]
            pub enum GridError {
                NoTypeArea,
                BodyFontWithoutZero {
                    family: String,
                },
                UnusableFont {
                    error: crate::knave_grid::font::tables::FontError,
                },
                UnknownFontWeight {
                    owner: String,
                    weight: String,
                },
                MissingFontWeight {
                    owner: String,
                    family: String,
                    weight: String,
                },
                TypeAreaDoesNotFit {
                    layout: String,
                    type_area: crate::knave_grid::spec::type_area::TypeArea,
                    fitting_counts: Vec<i64>,
                },
                TypeAreaNameRepeated {
                    name: String,
                },
                TypeAreasOutOfOrder {
                    name: String,
                    min_width_em: f64,
                    previous_name: String,
                    previous_em: f64,
                },
                MeasureColumnsOutside {
                    layout: String,
                    columns: i64,
                    column_count: i64,
                },
                SquareNotWholeCharacters {
                    square_px: f64,
                    ch_px: f64,
                },
                TypeStyleWithoutLines {
                    name: String,
                },
                PageMarginTooSmall {
                    edge: String,
                    squares: i64,
                },
                FieldsTooSmall {
                    layout: String,
                    lines: i64,
                    gap: i64,
                },
                CapitalsTallerThanStyle {
                    name: String,
                    needed_lines: i64,
                    lines: i64,
                },
                BaselineLineOutsideStyle {
                    name: String,
                    baseline_line: i64,
                    lines: i64,
                },
                TypeStyleTooBig {
                    name: String,
                    font_size_px: f64,
                    glyph_height_px: f64,
                    line_height_px: f64,
                },
                Unwritable {
                    path: String,
                    reason: String,
                },
            }

            fn line_count_text(count: i64) -> String {
                if count == 1 {
                    "1 line".to_string()
                } else {
                    format!("{} lines", count)
                }
            }

            pub fn column_count_text(count: i64) -> String {
                if count == 1 {
                    "1 column".to_string()
                } else {
                    format!("{} columns", count)
                }
            }

            pub fn squares(count: i64) -> String {
                if count == 1 {
                    "1 square".to_string()
                } else {
                    format!("{} squares", count)
                }
            }

            fn fit_message(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
                fitting_counts: &Vec<i64>,
            ) -> String {
                format!(
                    "{} with a gutter of {} do not fit {} columns; the column counts that fit are {}",
                    squares(type_area.width),
                    squares(type_area.gutter),
                    type_area.column_count,
                    fitting_counts
                        .iter()
                        .map(|count| count.to_string())
                        .collect::<Vec<_>>()
                        .join(", ")
                )
            }

            impl std::fmt::Display for GridError {
                fn fmt(&self, out: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                    match self {
                        GridError::NoTypeArea => {
                            write!(out, "a grid spec needs at least one type area")
                        }
                        GridError::BodyFontWithoutZero { family } => write!(
                            out,
                            "the body font {} has no glyph for 0, so the grid cannot measure its characters; give the body a full font file",
                            family
                        ),
                        GridError::UnusableFont { error } => write!(out, "{}", error),
                        GridError::UnknownFontWeight { owner, weight } => write!(
                            out,
                            "{} sets the weight {}, but font weights are {}",
                            owner,
                            weight,
                            crate::knave_grid::font::weight::WEIGHT_NAMES
                        ),
                        GridError::MissingFontWeight {
                            owner,
                            family,
                            weight,
                        } => write!(
                            out,
                            "{} uses {} at weight {}, but the family has no {} file",
                            owner, family, weight, weight
                        ),
                        GridError::TypeAreaDoesNotFit {
                            layout,
                            type_area,
                            fitting_counts,
                        } => write!(
                            out,
                            "in {}, {}",
                            layout,
                            fit_message(type_area, fitting_counts)
                        ),
                        GridError::TypeAreaNameRepeated { name } => write!(
                            out,
                            "two type areas are named {}; give each its own name",
                            name
                        ),
                        GridError::TypeAreasOutOfOrder {
                            name,
                            min_width_em,
                            previous_name,
                            previous_em,
                        } => write!(
                            out,
                            "the {} type area needs {}em, no more than the {} type area before it, which needs {}em; list type areas from narrowest to widest",
                            name, min_width_em, previous_name, previous_em
                        ),
                        GridError::MeasureColumnsOutside {
                            layout,
                            columns,
                            column_count,
                        } => write!(
                            out,
                            "in {}, the measure spans {}, but the type area has columns 1 to {}",
                            layout,
                            column_count_text(*columns),
                            column_count
                        ),
                        GridError::SquareNotWholeCharacters { square_px, ch_px } => write!(
                            out,
                            "the body font is monospace, but a square of {}px is {} characters of {}px; choose a line-height that makes it a whole number",
                            square_px,
                            *square_px / *ch_px,
                            ch_px
                        ),
                        GridError::TypeStyleWithoutLines { name } => {
                            write!(out, "the type style {} needs at least one line", name)
                        }
                        GridError::FieldsTooSmall { layout, lines, gap } => write!(
                            out,
                            "in {}, fields are {} with {} between them, but a field needs at least one line and a gap cannot be negative",
                            layout,
                            line_count_text(*lines),
                            line_count_text(*gap)
                        ),
                        GridError::PageMarginTooSmall {
                            edge,
                            squares: squares_count,
                        } => write!(
                            out,
                            "the {} margin is {}, but a page edge needs at least one square to its nearest baseline",
                            edge,
                            squares(*squares_count)
                        ),
                        GridError::CapitalsTallerThanStyle {
                            name,
                            needed_lines,
                            lines,
                        } => write!(
                            out,
                            "the capitals of the type style {} need {} to hang from the top of its block, but it has {}",
                            name,
                            line_count_text(*needed_lines),
                            line_count_text(*lines)
                        ),
                        GridError::BaselineLineOutsideStyle {
                            name,
                            baseline_line,
                            lines,
                        } => write!(
                            out,
                            "the type style {} puts its baseline on line {}, but it has lines 1 to {}",
                            name, baseline_line, lines
                        ),
                        GridError::TypeStyleTooBig {
                            name,
                            font_size_px,
                            glyph_height_px,
                            line_height_px,
                        } => write!(
                            out,
                            "the type style {} sets {}px type, whose glyphs are {}px tall, in {}px of lines",
                            name, font_size_px, glyph_height_px, line_height_px
                        ),
                        GridError::Unwritable { path, reason } => {
                            write!(out, "cannot write {}: {}", path, reason)
                        }
                    }
                }
            }
        }

        pub(crate) mod square {
            const WHOLE_NUMBER_TOLERANCE: f64 = 0.000001;

            pub fn check_square(
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                let square_px = crate::knave_grid::spec::body_type::leading_px(body);
                let ch = crate::knave_grid::spec::body_type::ch_px(body);
                let characters = square_px / ch;
                if crate::knave_grid::spec::body_type::body_metrics(body).is_monospace
                    && abs_difference(characters, characters.round()) > WHOLE_NUMBER_TOLERANCE
                {
                    Err(
                        crate::knave_grid::check::problems::GridError::SquareNotWholeCharacters {
                            square_px: square_px,
                            ch_px: ch,
                        },
                    )
                } else {
                    Ok(())
                }
            }

            fn abs_difference(left: f64, right: f64) -> f64 {
                if left > right {
                    left - right
                } else {
                    right - left
                }
            }
        }

        pub(crate) mod type_styles {
            pub fn check_type_styles(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                mut index: usize,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                loop {
                    if index >= spec.type_styles.len() {
                        return Ok(());
                    } else {
                        check_type_style(&spec.type_styles[index], &spec.body_type)?;
                        index += 1;
                        continue;
                    }
                }
            }

            fn check_type_style(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                let lines: i64 = style.lines;
                let baseline_line: i64 =
                    crate::knave_grid::spec::type_style::style_baseline_line(style, body);
                if lines < 1 {
                    Err(
                        crate::knave_grid::check::problems::GridError::TypeStyleWithoutLines {
                            name: style.name.clone(),
                        },
                    )
                } else if is_hanging(style) {
                    check_hanging(style, baseline_line, lines)
                } else {
                    check_type_style_size(style, body)?;
                    check_baseline_line(style, baseline_line, lines)
                }
            }

            fn is_hanging(style: &crate::knave_grid::spec::type_style::TypeStyle) -> bool {
                match style.baseline_line {
                    Some(_) => false,
                    None => true,
                }
            }

            fn check_hanging(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
                hanging_line: i64,
                lines: i64,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                if hanging_line > lines {
                    Err(
                        crate::knave_grid::check::problems::GridError::CapitalsTallerThanStyle {
                            name: style.name.clone(),
                            needed_lines: hanging_line,
                            lines: lines,
                        },
                    )
                } else {
                    Ok(())
                }
            }

            fn check_baseline_line(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
                baseline_line: i64,
                lines: i64,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                if baseline_line < 1 || baseline_line > lines {
                    Err(
                        crate::knave_grid::check::problems::GridError::BaselineLineOutsideStyle {
                            name: style.name.clone(),
                            baseline_line: baseline_line,
                            lines: lines,
                        },
                    )
                } else {
                    Ok(())
                }
            }

            fn check_type_style_size(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> Result<(), crate::knave_grid::check::problems::GridError> {
                let font_size_px =
                    crate::knave_grid::spec::type_style::style_font_size_px(style, body);
                let glyph_height = crate::knave_grid::spec::line_box::glyph_height_px(
                    &crate::knave_grid::spec::type_style::style_metrics(style, body),
                    font_size_px,
                );
                let line_height =
                    crate::knave_grid::spec::type_style::style_line_height_px(style, body);
                if glyph_height > line_height {
                    Err(
                        crate::knave_grid::check::problems::GridError::TypeStyleTooBig {
                            name: style.name.clone(),
                            font_size_px: font_size_px,
                            glyph_height_px: glyph_height,
                            line_height_px: line_height,
                        },
                    )
                } else {
                    Ok(())
                }
            }
        }

        pub(crate) mod warnings {
            pub const NARROWEST_MEASURE_CH: f64 = 45.0;

            pub const WIDEST_MEASURE_CH: f64 = 75.0;

            #[derive(Clone, PartialEq)]
            pub enum GridWarning {
                MeasureOutOfRange {
                    layout: String,
                    columns: i64,
                    characters: f64,
                },
            }

            impl std::fmt::Display for GridWarning {
                fn fmt(&self, out: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                    let GridWarning::MeasureOutOfRange {
                        layout,
                        columns,
                        characters,
                    } = self;
                    write!(
                        out,
                        "in {}, the measure spans {}, {} characters, outside {} to {}",
                        layout,
                        crate::knave_grid::check::problems::column_count_text(*columns),
                        characters,
                        NARROWEST_MEASURE_CH,
                        WIDEST_MEASURE_CH
                    )
                }
            }
        }
    }

    pub(crate) mod css {

        pub(crate) mod baseline {
            pub fn baseline_offset_css(
                metrics: &crate::knave_grid::font::metrics::FontMetrics,
                font_size: &str,
                line_height: &str,
            ) -> String {
                let ascent = whole_pixels_css(metrics, metrics.ascent, font_size);
                let descent = whole_pixels_css(metrics, metrics.descent, font_size);
                format!(
                    "calc(round(down, ({} - {} - {}) / 2, 1px) + {})",
                    line_height, ascent, descent, ascent
                )
            }

            fn whole_pixels_css(
                metrics: &crate::knave_grid::font::metrics::FontMetrics,
                font_units: i64,
                font_size: &str,
            ) -> String {
                format!(
                    "round({} * {}, 1px)",
                    (font_units as f64) / (metrics.units_per_em as f64),
                    font_size
                )
            }
        }

        pub(crate) mod declaration {
            pub fn declaration<A: std::fmt::Display + ?Sized, B: std::fmt::Display + ?Sized>(
                property: &A,
                value: &B,
            ) -> String {
                format!("  {}: {};\n", property, value)
            }
        }

        pub(crate) mod exact_baselines {
            const ROUND_SUPPORT_QUERY: &str = "@supports (top: round(1px, 1px))";

            pub fn exact_baseline_rules(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
            ) -> String {
                let body = &spec.body_type;
                let root = format!(
                    ":root {{\n{}}}\n",
                    crate::knave_grid::css::declaration::declaration(
                        "--_grid-baseline-offset",
                        &crate::knave_grid::css::baseline::baseline_offset_css(
                            crate::knave_grid::spec::body_type::body_metrics(body),
                            "1rem",
                            "1rlh"
                        )
                    )
                );
                let rules = spec
                    .type_styles
                    .iter()
                    .map(|style: &crate::knave_grid::spec::type_style::TypeStyle| {
                        exact_shift_rule(style, body)
                    })
                    .fold(root, |all: String, rule: String| {
                        format!("{}\n{}", all, rule)
                    });
                format!(
                    "\n{} {{\n{}}}\n",
                    ROUND_SUPPORT_QUERY,
                    rules
                        .as_str()
                        .lines()
                        .map(|line| if line.is_empty() {
                            String::from("\n")
                        } else {
                            format!("  {}\n", line)
                        })
                        .collect::<String>()
                )
            }

            fn exact_shift_rule(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> String {
                let lines: i64 = style.lines;
                let offset = crate::knave_grid::css::baseline::baseline_offset_css(
                    &crate::knave_grid::spec::type_style::style_metrics(style, body),
                    "1em",
                    format!("{}rlh", lines).as_str(),
                );
                format!(
                    "{} {{\n{}}}\n",
                    crate::knave_grid::css::type_styles::style_selector(style),
                    crate::knave_grid::css::declaration::declaration(
                        "top",
                        &format!(
                            "calc({}rlh + var(--_grid-baseline-offset) - {})",
                            crate::knave_grid::spec::type_style::style_baseline_line(style, body)
                                - 1,
                            offset
                        )
                    )
                )
            }
        }

        pub(crate) mod field_rows {
            pub fn field_row_declarations(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
            ) -> String {
                match type_area.field_lines {
                    Some(lines) => {
                        let gap: i64 = type_area.field_gap;
                        format!(
                            "{}{}{}",
                            crate::knave_grid::css::declaration::declaration(
                                "--field",
                                &lines_css(lines)
                            ),
                            crate::knave_grid::css::declaration::declaration(
                                "--field-gap",
                                &lines_css(gap)
                            ),
                            crate::knave_grid::css::declaration::declaration(
                                "--field-pitch",
                                &lines_css(lines + gap)
                            )
                        )
                    }
                    None => "".to_string(),
                }
            }

            fn lines_css(count: i64) -> String {
                format!("{}rlh", count)
            }
        }

        pub(crate) mod fields {
            pub const FIELD_RULE: &str = ".field {\n  box-sizing: border-box;\n  height: max(calc(var(--field-lines, 1) * var(--leading)), calc(var(--fields, 0) * var(--field-pitch, 0px) - min(var(--fields, 0), 1) * var(--field-gap, 0px)));\n  padding-block: var(--_grid-cap-top) calc(var(--leading) - var(--_grid-descender-bottom));\n  background-clip: content-box;\n  object-fit: cover;\n}\n";

            pub fn field_declarations(
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> String {
                let metrics = crate::knave_grid::spec::body_type::body_metrics(body);
                let em = metrics.units_per_em as f64;
                format!(
                    "{}{}",
                    crate::knave_grid::css::declaration::declaration(
                        "--_grid-cap-top",
                        &format!(
                            "calc(var(--_grid-baseline-offset) - {} * 1rem)",
                            (metrics.cap_height as f64) / em
                        )
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "--_grid-descender-bottom",
                        &format!(
                            "calc(var(--_grid-baseline-offset) + {} * 1rem)",
                            (metrics.descent as f64) / em
                        )
                    )
                )
            }
        }

        pub(crate) mod font_face {
            pub fn font_face_css(spec: &crate::knave_grid::spec::grid_spec::GridSpec) -> String {
                spec_families(spec)
                    .iter()
                    .map(|argument: &crate::knave_grid::font::family::FontFamily| {
                        family_rules(argument)
                    })
                    .collect::<Vec<_>>()
                    .join("\n")
            }

            pub fn spec_families(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
            ) -> Vec<crate::knave_grid::font::family::FontFamily> {
                let mut families = vec![spec.body_type.font_family.clone()];
                spec.type_styles.iter().for_each(
                    |style: &crate::knave_grid::spec::type_style::TypeStyle| match &style
                        .font_family
                    {
                        Some(family) => {
                            if !families.iter().any(
                                |known: &crate::knave_grid::font::family::FontFamily| {
                                    known.name == family.name
                                },
                            ) {
                                families.push(family.clone())
                            }
                        }
                        None => {}
                    },
                );
                families
            }

            fn family_rules(family: &crate::knave_grid::font::family::FontFamily) -> String {
                family
                    .faces
                    .iter()
                    .map(|face: &crate::knave_grid::font::family::FontFace| {
                        font_face_rule(family, face)
                    })
                    .collect::<Vec<_>>()
                    .join("\n")
            }

            fn font_face_rule(
                family: &crate::knave_grid::font::family::FontFamily,
                face: &crate::knave_grid::font::family::FontFace,
            ) -> String {
                let metrics = face.metrics;
                format!(
                    "@font-face {{\n{}{}{}{}{}{}{}}}\n",
                    crate::knave_grid::css::declaration::declaration(
                        "font-family",
                        &format!("\"{}\"", family.name)
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "src",
                        &format!("url(\"{}\")", face.file_name)
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "font-weight",
                        &face.weight.to_string()
                    ),
                    crate::knave_grid::css::declaration::declaration("font-display", "swap"),
                    crate::knave_grid::css::declaration::declaration(
                        "ascent-override",
                        &em_percent(&metrics, metrics.ascent)
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "descent-override",
                        &em_percent(&metrics, metrics.descent)
                    ),
                    crate::knave_grid::css::declaration::declaration("line-gap-override", "0%")
                )
            }

            fn em_percent(
                metrics: &crate::knave_grid::font::metrics::FontMetrics,
                font_units: i64,
            ) -> String {
                format!(
                    "{}%",
                    ((100 * font_units) as f64) / (metrics.units_per_em as f64)
                )
            }
        }

        pub(crate) mod grid {
            const TYPE_AREA_RULE: &str = ".type-area {\n  width: min(100% - 2 * var(--_grid-margin), var(--_grid-grid-width));\n  margin-inline: auto;\n  padding-block: calc(var(--_grid-head) * var(--leading) - var(--_grid-baseline-offset)) calc((var(--_grid-foot) - 1) * var(--leading) + var(--_grid-baseline-offset));\n}\n\n@supports (width: round(down, 1px, 1px)) {\n  .type-area {\n    width: min(round(down, 100% - 2 * var(--_grid-margin), var(--leading)), var(--_grid-grid-width));\n  }\n}\n";

            const GRID_RULE: &str = ".grid {\n  display: grid;\n  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));\n  column-gap: var(--gutter);\n}\n";

            pub fn grid_css(checked: &crate::knave_grid::check::grid::CheckedGrid) -> String {
                let spec = &checked.spec;
                let all = &checked.layouts;
                format!(
                    "{}\n{}{}\n{}\n{}\n{}{}{}",
                    crate::knave_grid::css::font_face::font_face_css(spec),
                    root_rule(spec, &all[0]),
                    media_rules(spec, all),
                    TYPE_AREA_RULE,
                    GRID_RULE,
                    crate::knave_grid::css::fields::FIELD_RULE,
                    crate::knave_grid::css::type_styles::type_style_rules(spec),
                    crate::knave_grid::css::exact_baselines::exact_baseline_rules(spec)
                )
            }

            fn root_rule(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                narrowest: &crate::knave_grid::spec::layout::Layout,
            ) -> String {
                let r#type = &spec.body_type;
                format!(
                    ":root {{\n{}{}{}{}{}{}{}{}}}\n",
                    crate::knave_grid::css::declaration::declaration(
                        "font-size",
                        &format!("{}%", root_font_size_percent(r#type))
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "font-family",
                        &format!("\"{}\"", r#type.font_family.name)
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "font-weight",
                        &crate::knave_grid::spec::body_type::body_weight(r#type).to_string()
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "line-height",
                        &r#type.line_height.to_string()
                    ),
                    crate::knave_grid::css::declaration::declaration("--leading", &squares_css(1)),
                    crate::knave_grid::css::declaration::declaration(
                        "--_grid-baseline-offset",
                        &baseline_offset_rem(r#type)
                    ),
                    crate::knave_grid::css::fields::field_declarations(r#type),
                    type_area_declarations(&narrowest.type_area, spec)
                )
            }

            fn media_rules(
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
                all: &[crate::knave_grid::spec::layout::Layout],
            ) -> String {
                all.iter()
                    .filter(|layout: &&crate::knave_grid::spec::layout::Layout| {
                        !layout.is_narrowest
                    })
                    .map(|layout: &crate::knave_grid::spec::layout::Layout| {
                        media_rule(layout, spec)
                    })
                    .fold("".to_string(), |rules: String, rule: String| {
                        format!("{}\n{}", rules, rule)
                    })
            }

            fn media_rule(
                layout: &crate::knave_grid::spec::layout::Layout,
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
            ) -> String {
                let root = format!(
                    ":root {{\n{}}}\n",
                    type_area_declarations(&layout.type_area, spec)
                );
                format!(
                    "@media (min-width: {}em) {{\n{}}}\n",
                    layout.min_width_em,
                    root.as_str()
                        .lines()
                        .map(|line| if line.is_empty() {
                            String::from("\n")
                        } else {
                            format!("  {}\n", line)
                        })
                        .collect::<String>()
                )
            }

            fn type_area_declarations(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
            ) -> String {
                format!(
                    "{}{}{}{}{}{}{}{}{}",
                    crate::knave_grid::css::declaration::declaration(
                        "--gutter",
                        &squares_css(type_area.gutter)
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "--columns",
                        &type_area.column_count.to_string()
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "--column",
                        &squares_css(crate::knave_grid::spec::type_area::span_width(type_area, 1))
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "--_grid-grid-width",
                        &squares_css(type_area.width)
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "--_grid-margin",
                        &squares_css(type_area.margin)
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "--_grid-head",
                        &type_area.head.to_string()
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "--_grid-foot",
                        &type_area.foot.to_string()
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "--measure",
                        &measure_css(type_area, spec)
                    ),
                    crate::knave_grid::css::field_rows::field_row_declarations(type_area)
                )
            }

            fn measure_css(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
                spec: &crate::knave_grid::spec::grid_spec::GridSpec,
            ) -> String {
                squares_css(crate::knave_grid::spec::type_area::span_width(
                    type_area,
                    crate::knave_grid::spec::measure::measure_columns(type_area, &spec.body_type),
                ))
            }

            fn squares_css(count: i64) -> String {
                format!("{}rlh", count)
            }

            fn baseline_offset_rem(
                r#type: &crate::knave_grid::spec::body_type::BodyType,
            ) -> String {
                format!(
                    "calc({}rem / {})",
                    crate::knave_grid::spec::body_type::baseline_offset_px(r#type),
                    r#type.size
                )
            }

            fn root_font_size_percent(
                r#type: &crate::knave_grid::spec::body_type::BodyType,
            ) -> f64 {
                100.0 * (r#type.size / crate::knave_grid::browser::DEFAULT_FONT_SIZE_PX)
            }
        }

        pub(crate) mod type_styles {
            pub fn type_style_rules(spec: &crate::knave_grid::spec::grid_spec::GridSpec) -> String {
                spec.type_styles
                    .iter()
                    .map(|style: &crate::knave_grid::spec::type_style::TypeStyle| {
                        type_style_rule(style, &spec.body_type)
                    })
                    .fold("".to_string(), |rules: String, rule: String| {
                        format!("{}\n{}", rules, rule)
                    })
            }

            fn type_style_rule(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> String {
                format!(
                    "{} {{\n{}{}{}{}{}{}}}\n",
                    style_selector(style),
                    family_declaration(style),
                    weight_declaration(style, body),
                    crate::knave_grid::css::declaration::declaration(
                        "font-size",
                        &relative_to_body(
                            crate::knave_grid::spec::type_style::style_font_size_px(style, body),
                            body
                        )
                    ),
                    crate::knave_grid::css::declaration::declaration(
                        "line-height",
                        &format!("{}rlh", style.lines)
                    ),
                    crate::knave_grid::css::declaration::declaration("position", "relative"),
                    crate::knave_grid::css::declaration::declaration(
                        "top",
                        &relative_to_body(
                            crate::knave_grid::spec::type_style::style_shift_px(style, body),
                            body
                        )
                    )
                )
            }

            fn family_declaration(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
            ) -> String {
                match &style.font_family {
                    Some(family) => crate::knave_grid::css::declaration::declaration(
                        "font-family",
                        &format!("\"{}\"", family.name),
                    ),
                    None => "".to_string(),
                }
            }

            fn weight_declaration(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> String {
                match &style.weight {
                    Some(_) => crate::knave_grid::css::declaration::declaration(
                        "font-weight",
                        &crate::knave_grid::spec::type_style::style_weight(style, body).to_string(),
                    ),
                    None => "".to_string(),
                }
            }

            pub fn style_selector(
                style: &crate::knave_grid::spec::type_style::TypeStyle,
            ) -> String {
                let class_selector = format!(".type-{}", style.name);
                match &style.selector {
                    Some(extra) => format!("{}, {}", class_selector, extra),
                    None => class_selector,
                }
            }

            fn relative_to_body(
                px: f64,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> String {
                format!("calc({}rem / {})", px, body.size)
            }
        }
    }

    pub(crate) mod font {

        pub(crate) mod character_map {
            const GLYPH_ID_MODULUS: i64 = 65536;

            const FORMAT_12_GROUP_SIZE: i64 = 12;

            pub fn glyph_for(
                tables: &crate::knave_grid::font::tables::FontTables,
                code_point: i64,
            ) -> Result<Option<i64>, crate::knave_grid::font::tables::FontError> {
                let data = &tables.data;
                let subtable: i64 = unicode_subtable(
                    data,
                    crate::knave_grid::font::tables::table_offset(tables, "cmap")?,
                    0,
                )?;
                let format: i64 = crate::knave_grid::font::tables::present(
                    usize::try_from(subtable)
                        .ok()
                        .and_then(|start| data.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]]))),
                )?;
                let glyph: i64 = if format == 4 {
                    format_4_glyph(data, subtable, code_point)?
                } else {
                    format_12_glyph(data, subtable, code_point)?
                };
                Ok(if glyph == 0 { None } else { Some(glyph) })
            }

            fn unicode_subtable(
                data: &Vec<u8>,
                cmap: i64,
                mut index: i64,
            ) -> Result<i64, crate::knave_grid::font::tables::FontError> {
                loop {
                    let record_count: i64 = crate::knave_grid::font::tables::present({
                        let template_argument_0 = data;
                        let template_argument_1 = cmap + 2;
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 2))
                            .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                    })?;
                    let record: i64 = cmap + 4 + 8 * index;
                    if index == record_count {
                        return crate::knave_grid::font::tables::malformed(
                            "the font maps no Unicode characters in a format the library reads",
                        );
                    } else {
                        let platform: i64 = crate::knave_grid::font::tables::present(
                            usize::try_from(record)
                                .ok()
                                .and_then(|start| data.get(start..start + 2))
                                .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]]))),
                        )?;
                        let encoding: i64 = crate::knave_grid::font::tables::present({
                            let template_argument_0 = data;
                            let template_argument_1 = record + 2;
                            usize::try_from(template_argument_1)
                                .ok()
                                .and_then(|start| template_argument_0.get(start..start + 2))
                                .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                        })?;
                        let subtable: i64 = cmap
                            + crate::knave_grid::font::tables::present({
                                let template_argument_0 = data;
                                let template_argument_1 = record + 4;
                                usize::try_from(template_argument_1)
                                    .ok()
                                    .and_then(|start| template_argument_0.get(start..start + 4))
                                    .map(|bytes| {
                                        i64::from(u32::from_be_bytes([
                                            bytes[0], bytes[1], bytes[2], bytes[3],
                                        ]))
                                    })
                            })?;
                        let format: i64 = crate::knave_grid::font::tables::present(
                            usize::try_from(subtable)
                                .ok()
                                .and_then(|start| data.get(start..start + 2))
                                .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]]))),
                        )?;
                        if is_unicode_encoding(platform, encoding) && (format == 4 || format == 12)
                        {
                            return Ok(subtable);
                        } else {
                            index += 1;
                            continue;
                        }
                    }
                }
            }

            fn is_unicode_encoding(platform: i64, encoding: i64) -> bool {
                platform == 0 || platform == 3 && (encoding == 1 || encoding == 10)
            }

            fn format_4_glyph(
                data: &Vec<u8>,
                subtable: i64,
                code_point: i64,
            ) -> Result<i64, crate::knave_grid::font::tables::FontError> {
                let segment_count: i64 = crate::knave_grid::font::tables::present({
                    let template_argument_0 = data;
                    let template_argument_1 = subtable + 6;
                    usize::try_from(template_argument_1)
                        .ok()
                        .and_then(|start| template_argument_0.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                })? / 2;
                let ends: i64 = subtable + 14;
                let starts: i64 = ends + 2 * segment_count + 2;
                let deltas: i64 = starts + 2 * segment_count;
                let range_offsets: i64 = deltas + 2 * segment_count;
                let segment: i64 =
                    segment_ending_at_or_after(data, ends, segment_count, code_point, 0)?;
                let start: i64 = crate::knave_grid::font::tables::present({
                    let template_argument_0 = data;
                    let template_argument_1 = starts + 2 * segment;
                    usize::try_from(template_argument_1)
                        .ok()
                        .and_then(|start| template_argument_0.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                })?;
                let delta: i64 = crate::knave_grid::font::tables::present({
                    let template_argument_0 = data;
                    let template_argument_1 = deltas + 2 * segment;
                    usize::try_from(template_argument_1)
                        .ok()
                        .and_then(|start| template_argument_0.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                })?;
                let range_offset_position: i64 = range_offsets + 2 * segment;
                let range_offset: i64 = crate::knave_grid::font::tables::present(
                    usize::try_from(range_offset_position)
                        .ok()
                        .and_then(|start| data.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]]))),
                )?;
                if start > code_point {
                    Ok(0)
                } else if range_offset == 0 {
                    Ok((code_point + delta) % GLYPH_ID_MODULUS)
                } else {
                    let glyph: i64 = crate::knave_grid::font::tables::present({
                        let template_argument_0 = data;
                        let template_argument_1 =
                            range_offset_position + range_offset + 2 * (code_point - start);
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 2))
                            .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                    })?;
                    Ok(if glyph == 0 {
                        0
                    } else {
                        (glyph + delta) % GLYPH_ID_MODULUS
                    })
                }
            }

            fn segment_ending_at_or_after(
                data: &Vec<u8>,
                ends: i64,
                segment_count: i64,
                code_point: i64,
                mut segment: i64,
            ) -> Result<i64, crate::knave_grid::font::tables::FontError> {
                loop {
                    if segment == segment_count {
                        return crate::knave_grid::font::tables::malformed(
                            "the font's character map has no final segment",
                        );
                    } else if crate::knave_grid::font::tables::present({
                        let template_argument_0 = data;
                        let template_argument_1 = ends + 2 * segment;
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 2))
                            .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                    })? >= code_point
                    {
                        return Ok(segment);
                    } else {
                        segment += 1;
                        continue;
                    }
                }
            }

            fn format_12_glyph(
                data: &Vec<u8>,
                subtable: i64,
                code_point: i64,
            ) -> Result<i64, crate::knave_grid::font::tables::FontError> {
                format_12_group_glyph(
                    data,
                    subtable + 16,
                    crate::knave_grid::font::tables::present({
                        let template_argument_0 = data;
                        let template_argument_1 = subtable + 12;
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 4))
                            .map(|bytes| {
                                i64::from(u32::from_be_bytes([
                                    bytes[0], bytes[1], bytes[2], bytes[3],
                                ]))
                            })
                    })?,
                    code_point,
                )
            }

            fn format_12_group_glyph(
                data: &Vec<u8>,
                mut group: i64,
                mut remaining: i64,
                code_point: i64,
            ) -> Result<i64, crate::knave_grid::font::tables::FontError> {
                loop {
                    if remaining == 0 {
                        return Ok(0);
                    } else {
                        let first: i64 = crate::knave_grid::font::tables::present(
                            usize::try_from(group)
                                .ok()
                                .and_then(|start| data.get(start..start + 4))
                                .map(|bytes| {
                                    i64::from(u32::from_be_bytes([
                                        bytes[0], bytes[1], bytes[2], bytes[3],
                                    ]))
                                }),
                        )?;
                        let last: i64 = crate::knave_grid::font::tables::present({
                            let template_argument_0 = data;
                            let template_argument_1 = group + 4;
                            usize::try_from(template_argument_1)
                                .ok()
                                .and_then(|start| template_argument_0.get(start..start + 4))
                                .map(|bytes| {
                                    i64::from(u32::from_be_bytes([
                                        bytes[0], bytes[1], bytes[2], bytes[3],
                                    ]))
                                })
                        })?;
                        if first <= code_point && code_point <= last {
                            return Ok(crate::knave_grid::font::tables::present({
                                let template_argument_0 = data;
                                let template_argument_1 = group + 8;
                                usize::try_from(template_argument_1)
                                    .ok()
                                    .and_then(|start| template_argument_0.get(start..start + 4))
                                    .map(|bytes| {
                                        i64::from(u32::from_be_bytes([
                                            bytes[0], bytes[1], bytes[2], bytes[3],
                                        ]))
                                    })
                            })? + (code_point - first));
                        } else {
                            (group, remaining) = (group + FORMAT_12_GROUP_SIZE, remaining - 1);
                            continue;
                        }
                    }
                }
            }
        }

        pub(crate) mod family {
            #[derive(Clone, PartialEq, Eq, Hash)]
            pub struct DeclaredFile {
                pub weight_name: String,
                pub file_name: String,
            }

            pub(crate) fn make_declared_file(
                weight_name: String,
                file_name: String,
            ) -> DeclaredFile {
                DeclaredFile {
                    weight_name,
                    file_name,
                }
            }

            #[derive(Clone, PartialEq, Eq, Hash)]
            pub struct FontFace {
                pub weight: i64,
                pub file_name: String,
                pub path: String,
                pub metrics: crate::knave_grid::font::metrics::FontMetrics,
            }

            fn make_font_face(
                weight: i64,
                file_name: String,
                path: String,
                metrics: crate::knave_grid::font::metrics::FontMetrics,
            ) -> FontFace {
                FontFace {
                    weight,
                    file_name,
                    path,
                    metrics,
                }
            }

            #[derive(Clone, PartialEq, Eq, Hash)]
            pub struct FontFamily {
                pub name: String,
                pub faces: Vec<FontFace>,
            }

            fn make_font_family(name: String, faces: Vec<FontFace>) -> FontFamily {
                FontFamily { name, faces }
            }

            pub fn read_declared_family(
                directory: &str,
                name: &str,
                files: Vec<DeclaredFile>,
            ) -> Result<FontFamily, crate::knave_grid::font::tables::FontError> {
                if files.is_empty() {
                    Err(
                        crate::knave_grid::font::tables::FontError::FamilyWithoutFiles {
                            family: name.to_string(),
                        },
                    )
                } else {
                    Ok(make_font_family(
                        name.to_string(),
                        read_faces(directory, name, &files, 0, Vec::new())?,
                    ))
                }
            }

            fn read_faces(
                directory: &str,
                name: &str,
                files: &[DeclaredFile],
                mut index: usize,
                mut faces: Vec<FontFace>,
            ) -> Result<Vec<FontFace>, crate::knave_grid::font::tables::FontError> {
                loop {
                    if index >= files.len() {
                        return Ok(faces);
                    } else {
                        let face = read_face(directory, name, &files[index])?;
                        let read = {
                            faces.push(face);
                            faces
                        };
                        (index, faces) = (index + 1, read);
                        continue;
                    }
                }
            }

            fn read_face(
                directory: &str,
                name: &str,
                file: &DeclaredFile,
            ) -> Result<FontFace, crate::knave_grid::font::tables::FontError> {
                let path = format!("{}/{}", directory, file.file_name);
                match crate::knave_grid::font::weight::weight_number(file.weight_name.as_str()) {
                    Some(weight) => Ok(make_font_face(
                        weight,
                        file.file_name.clone(),
                        path.clone(),
                        crate::knave_grid::font::metrics::read_font_metrics(path.as_str())?,
                    )),
                    None => Err(crate::knave_grid::font::tables::FontError::UnknownWeight {
                        family: name.to_string(),
                        weight: file.weight_name.clone(),
                    }),
                }
            }

            pub fn is_has_weight(family: &FontFamily, weight: i64) -> bool {
                family
                    .faces
                    .iter()
                    .any(|face: &FontFace| face.weight == weight)
            }

            pub fn family_metrics(
                family: &FontFamily,
                weight: i64,
            ) -> &crate::knave_grid::font::metrics::FontMetrics {
                &family.faces[face_index(family, weight, 0)].metrics
            }

            fn face_index(family: &FontFamily, weight: i64, mut index: usize) -> usize {
                loop {
                    if index >= family.faces.len() {
                        return 0;
                    } else if family.faces[index].weight == weight {
                        return index;
                    } else {
                        index += 1;
                        continue;
                    }
                }
            }

            impl crate::rt::Show for FontFamily {
                fn write_form(&self, out: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                    crate::rt::Record::open(out, "font-family")
                        .part(&self.name)
                        .close()
                }
            }
        }

        pub(crate) mod metrics {
            #[derive(Clone, Copy, PartialEq, Eq, Hash)]
            pub struct FontMetrics {
                pub units_per_em: i64,
                pub ascent: i64,
                pub descent: i64,
                pub zero_width: Option<i64>,
                pub cap_height: i64,
                pub is_monospace: bool,
            }

            fn make_font_metrics(
                units_per_em: i64,
                ascent: i64,
                descent: i64,
                zero_width_2: Option<i64>,
                cap_height_2: i64,
                is_monospace_2: bool,
            ) -> FontMetrics {
                FontMetrics {
                    units_per_em,
                    ascent,
                    descent,
                    zero_width: zero_width_2,
                    cap_height: cap_height_2,
                    is_monospace: is_monospace_2,
                }
            }

            const ZERO_CODE_POINT: i64 = 48;

            const UNITS_PER_EM_OFFSET: i64 = 18;

            const HHEA_ASCENDER_OFFSET: i64 = 4;

            const HHEA_DESCENDER_OFFSET: i64 = 6;

            const HHEA_METRIC_COUNT_OFFSET: i64 = 34;

            const OS2_CAP_HEIGHT_OFFSET: i64 = 88;

            const FIRST_OS2_VERSION_WITH_CAP_HEIGHT: i64 = 2;

            const POST_FIXED_PITCH_OFFSET: i64 = 12;

            pub fn read_font_metrics(
                path: &str,
            ) -> Result<FontMetrics, crate::knave_grid::font::tables::FontError> {
                match std::fs::read(path).map_err(|error| error.to_string()) {
                    Err(reason) => Err(crate::knave_grid::font::tables::FontError::Unreadable {
                        path: path.to_string(),
                        reason: reason,
                    }),
                    Ok(bytes) => parse_font_metrics(&bytes),
                }
            }

            pub fn parse_font_metrics(
                bytes: &Vec<u8>,
            ) -> Result<FontMetrics, crate::knave_grid::font::tables::FontError> {
                let tables = font_tables_of(bytes)?;
                metrics_from(&tables)
            }

            fn font_tables_of(
                bytes: &Vec<u8>,
            ) -> Result<
                crate::knave_grid::font::tables::FontTables,
                crate::knave_grid::font::tables::FontError,
            > {
                let signature = crate::knave_grid::font::tables::present(
                    usize::try_from(0)
                        .ok()
                        .and_then(|start| bytes.get(start..start + 4))
                        .map(|bytes| String::from_utf8_lossy(bytes).into_owned()),
                )?;
                if signature == "wOF2" {
                    crate::knave_grid::font::woff2::woff2_tables(bytes)
                } else if crate::knave_grid::font::sfnt::is_sfnt_signature(signature.as_str()) {
                    crate::knave_grid::font::sfnt::sfnt_tables(bytes)
                } else {
                    crate::knave_grid::font::tables::malformed(
                        "not a TrueType, OpenType or WOFF2 font",
                    )
                }
            }

            fn metrics_from(
                tables: &crate::knave_grid::font::tables::FontTables,
            ) -> Result<FontMetrics, crate::knave_grid::font::tables::FontError> {
                let data = &tables.data;
                let head: i64 = crate::knave_grid::font::tables::table_offset(tables, "head")?;
                let hhea: i64 = crate::knave_grid::font::tables::table_offset(tables, "hhea")?;
                let zero_glyph: Option<i64> =
                    crate::knave_grid::font::character_map::glyph_for(tables, ZERO_CODE_POINT)?;
                Ok(make_font_metrics(
                    crate::knave_grid::font::tables::present({
                        let template_argument_0 = data;
                        let template_argument_1 = head + UNITS_PER_EM_OFFSET;
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 2))
                            .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                    })?,
                    crate::knave_grid::font::tables::present({
                        let template_argument_0 = data;
                        let template_argument_1 = hhea + HHEA_ASCENDER_OFFSET;
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 2))
                            .map(|bytes| i64::from(i16::from_be_bytes([bytes[0], bytes[1]])))
                    })?,
                    0 - crate::knave_grid::font::tables::present({
                        let template_argument_0 = data;
                        let template_argument_1 = hhea + HHEA_DESCENDER_OFFSET;
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 2))
                            .map(|bytes| i64::from(i16::from_be_bytes([bytes[0], bytes[1]])))
                    })?,
                    zero_width(tables, zero_glyph)?,
                    cap_height(tables)?,
                    is_monospace(tables)?,
                ))
            }

            fn zero_width(
                tables: &crate::knave_grid::font::tables::FontTables,
                zero_glyph: Option<i64>,
            ) -> Result<Option<i64>, crate::knave_grid::font::tables::FontError> {
                match zero_glyph {
                    Some(glyph) => Ok(Some(advance_width(tables, glyph)?)),
                    None => Ok(None),
                }
            }

            fn advance_width(
                tables: &crate::knave_grid::font::tables::FontTables,
                glyph: i64,
            ) -> Result<i64, crate::knave_grid::font::tables::FontError> {
                let data = &tables.data;
                let hhea: i64 = crate::knave_grid::font::tables::table_offset(tables, "hhea")?;
                let metric_count: i64 = crate::knave_grid::font::tables::present({
                    let template_argument_0 = data;
                    let template_argument_1 = hhea + HHEA_METRIC_COUNT_OFFSET;
                    usize::try_from(template_argument_1)
                        .ok()
                        .and_then(|start| template_argument_0.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                })?;
                let metric: i64 = if glyph < metric_count {
                    glyph
                } else {
                    metric_count - 1
                };
                let hmtx = crate::knave_grid::font::tables::table_entry_for(tables, "hmtx")?;
                crate::knave_grid::font::tables::present({
                    let template_argument_0 = data;
                    let template_argument_1 = advance_position(&hmtx, metric);
                    usize::try_from(template_argument_1)
                        .ok()
                        .and_then(|start| template_argument_0.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]])))
                })
            }

            fn advance_position(
                hmtx: &crate::knave_grid::font::tables::TableEntry,
                metric: i64,
            ) -> i64 {
                if hmtx.is_transformed {
                    hmtx.offset + 1 + 2 * metric
                } else {
                    hmtx.offset + 4 * metric
                }
            }

            fn cap_height(
                tables: &crate::knave_grid::font::tables::FontTables,
            ) -> Result<i64, crate::knave_grid::font::tables::FontError> {
                let data = &tables.data;
                let os2: i64 = crate::knave_grid::font::tables::table_offset(tables, "OS/2")?;
                let version: i64 = crate::knave_grid::font::tables::present(
                    usize::try_from(os2)
                        .ok()
                        .and_then(|start| data.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]]))),
                )?;
                if version < FIRST_OS2_VERSION_WITH_CAP_HEIGHT {
                    crate::knave_grid::font::tables::malformed(
                        "the font's OS/2 table is older than version 2, so it has no cap height",
                    )
                } else {
                    crate::knave_grid::font::tables::present({
                        let template_argument_0 = data;
                        let template_argument_1 = os2 + OS2_CAP_HEIGHT_OFFSET;
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 2))
                            .map(|bytes| i64::from(i16::from_be_bytes([bytes[0], bytes[1]])))
                    })
                }
            }

            fn is_monospace(
                tables: &crate::knave_grid::font::tables::FontTables,
            ) -> Result<bool, crate::knave_grid::font::tables::FontError> {
                match crate::knave_grid::font::tables::table_offset(tables, "post") {
                    Err(_) => Ok(false),
                    Ok(post) => Ok(crate::knave_grid::font::tables::present({
                        let template_argument_0 = &tables.data;
                        let template_argument_1 = post + POST_FIXED_PITCH_OFFSET;
                        usize::try_from(template_argument_1)
                            .ok()
                            .and_then(|start| template_argument_0.get(start..start + 4))
                            .map(|bytes| {
                                i64::from(u32::from_be_bytes([
                                    bytes[0], bytes[1], bytes[2], bytes[3],
                                ]))
                            })
                    })? != 0),
                }
            }
        }

        pub(crate) mod sfnt {
            const TABLE_DIRECTORY_OFFSET: i64 = 12;

            const TABLE_RECORD_SIZE: i64 = 16;

            pub fn is_sfnt_signature(signature: &str) -> bool {
                signature == "\0\u{1}\0\0" || signature == "OTTO" || signature == "true"
            }

            pub fn sfnt_tables(
                bytes: &Vec<u8>,
            ) -> Result<
                crate::knave_grid::font::tables::FontTables,
                crate::knave_grid::font::tables::FontError,
            > {
                let table_count: i64 = crate::knave_grid::font::tables::present(
                    usize::try_from(4)
                        .ok()
                        .and_then(|start| bytes.get(start..start + 2))
                        .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]]))),
                )?;
                Ok(crate::knave_grid::font::tables::make_font_tables(
                    bytes.clone(),
                    sfnt_entries(bytes, table_count, 0, Vec::new())?,
                ))
            }

            fn sfnt_entries(
                bytes: &Vec<u8>,
                table_count: i64,
                mut index: i64,
                mut entries: Vec<crate::knave_grid::font::tables::TableEntry>,
            ) -> Result<
                Vec<crate::knave_grid::font::tables::TableEntry>,
                crate::knave_grid::font::tables::FontError,
            > {
                loop {
                    if index == table_count {
                        return Ok(entries);
                    } else {
                        let record: i64 = TABLE_DIRECTORY_OFFSET + TABLE_RECORD_SIZE * index;
                        entries.push(crate::knave_grid::font::tables::make_table_entry(
                            crate::knave_grid::font::tables::present(
                                usize::try_from(record)
                                    .ok()
                                    .and_then(|start| bytes.get(start..start + 4))
                                    .map(|bytes| String::from_utf8_lossy(bytes).into_owned()),
                            )?,
                            crate::knave_grid::font::tables::present({
                                let template_argument_0 = bytes;
                                let template_argument_1 = record + 8;
                                usize::try_from(template_argument_1)
                                    .ok()
                                    .and_then(|start| template_argument_0.get(start..start + 4))
                                    .map(|bytes| {
                                        i64::from(u32::from_be_bytes([
                                            bytes[0], bytes[1], bytes[2], bytes[3],
                                        ]))
                                    })
                            })?,
                            crate::knave_grid::font::tables::present({
                                let template_argument_0 = bytes;
                                let template_argument_1 = record + 12;
                                usize::try_from(template_argument_1)
                                    .ok()
                                    .and_then(|start| template_argument_0.get(start..start + 4))
                                    .map(|bytes| {
                                        i64::from(u32::from_be_bytes([
                                            bytes[0], bytes[1], bytes[2], bytes[3],
                                        ]))
                                    })
                            })?,
                            false,
                        ));
                        index += 1;
                        continue;
                    }
                }
            }
        }

        pub(crate) mod tables {
            #[derive(Clone, PartialEq, Eq, Hash)]
            pub enum FontError {
                Unreadable { path: String, reason: String },
                Malformed { reason: String },
                FamilyWithoutFiles { family: String },
                UnknownWeight { family: String, weight: String },
            }

            #[derive(Clone, PartialEq, Eq, Hash)]
            pub struct TableEntry {
                pub tag: String,
                pub offset: i64,
                pub length: i64,
                pub is_transformed: bool,
            }

            pub(crate) fn make_table_entry(
                tag: String,
                offset: i64,
                length: i64,
                is_transformed: bool,
            ) -> TableEntry {
                TableEntry {
                    tag,
                    offset,
                    length,
                    is_transformed,
                }
            }

            #[derive(Clone, PartialEq, Eq, Hash)]
            pub struct FontTables {
                pub data: Vec<u8>,
                pub entries: Vec<TableEntry>,
            }

            pub(crate) fn make_font_tables(data: Vec<u8>, entries: Vec<TableEntry>) -> FontTables {
                FontTables { data, entries }
            }

            pub fn table_offset(tables: &FontTables, tag: &str) -> Result<i64, FontError> {
                let entry = table_entry_for(tables, tag)?;
                Ok(entry.offset)
            }

            pub fn table_entry_for(
                tables: &FontTables,
                tag: &str,
            ) -> Result<TableEntry, FontError> {
                match tables
                    .entries
                    .iter()
                    .find(|entry: &&TableEntry| entry.tag == tag)
                {
                    Some(entry) => Ok(entry.clone()),
                    None => malformed(&format!("the font has no {} table", tag)),
                }
            }

            pub fn present<A>(value: Option<A>) -> Result<A, FontError> {
                value.ok_or(FontError::Malformed {
                    reason: "the font is truncated".to_string(),
                })
            }

            pub fn malformed<A: std::fmt::Display + ?Sized, B>(reason: &A) -> Result<B, FontError> {
                Err(FontError::Malformed {
                    reason: reason.to_string(),
                })
            }

            impl std::fmt::Display for FontError {
                fn fmt(&self, out: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                    match self {
                        FontError::Unreadable { path, reason } => {
                            write!(out, "cannot read {}: {}", path, reason)
                        }
                        FontError::Malformed { reason } => {
                            write!(out, "not a usable font: {}", reason)
                        }
                        FontError::FamilyWithoutFiles { family } => write!(
                            out,
                            "the font family {} needs at least one font file",
                            family
                        ),
                        FontError::UnknownWeight { family, weight } => write!(
                            out,
                            "the font family {} names the weight {}, but font weights are {}",
                            family,
                            weight,
                            crate::knave_grid::font::weight::WEIGHT_NAMES
                        ),
                    }
                }
            }
        }

        pub(crate) mod weight {
            pub const WEIGHT_NAMES: &str = "light, regular, medium or bold";

            pub fn weight_number(name: &str) -> Option<i64> {
                if name == "light" {
                    Some(300)
                } else if name == "regular" {
                    Some(400)
                } else if name == "medium" {
                    Some(500)
                } else if name == "bold" {
                    Some(700)
                } else {
                    None
                }
            }
        }

        pub(crate) mod woff2 {
            const WOFF2_HEADER_SIZE: i64 = 48;

            const BASE_128_MAX_BYTES: i64 = 5;

            #[derive(Clone, PartialEq, Eq, Hash)]
            struct Woff2Directory {
                entries: Vec<crate::knave_grid::font::tables::TableEntry>,
                end: i64,
            }

            fn make_woff2_directory(
                entries: Vec<crate::knave_grid::font::tables::TableEntry>,
                end: i64,
            ) -> Woff2Directory {
                Woff2Directory { entries, end }
            }

            #[derive(Clone, Copy, PartialEq, Eq, Hash)]
            struct Base128 {
                value: i64,
                end: i64,
            }

            fn make_base_128(value: i64, end: i64) -> Base128 {
                Base128 { value, end }
            }

            pub fn woff2_tables(
                bytes: &Vec<u8>,
            ) -> Result<
                crate::knave_grid::font::tables::FontTables,
                crate::knave_grid::font::tables::FontError,
            > {
                if crate::knave_grid::font::tables::present(
                    usize::try_from(4)
                        .ok()
                        .and_then(|start| bytes.get(start..start + 4))
                        .map(|bytes| String::from_utf8_lossy(bytes).into_owned()),
                )? == "ttcf"
                {
                    crate::knave_grid::font::tables::malformed(
                        "WOFF2 font collections are not supported",
                    )
                } else {
                    let table_count = crate::knave_grid::font::tables::present(
                        usize::try_from(12)
                            .ok()
                            .and_then(|start| bytes.get(start..start + 2))
                            .map(|bytes| i64::from(u16::from_be_bytes([bytes[0], bytes[1]]))),
                    )?;
                    let compressed_size = crate::knave_grid::font::tables::present(
                        usize::try_from(20)
                            .ok()
                            .and_then(|start| bytes.get(start..start + 4))
                            .map(|bytes| {
                                i64::from(u32::from_be_bytes([
                                    bytes[0], bytes[1], bytes[2], bytes[3],
                                ]))
                            }),
                    )?;
                    let Woff2Directory {
                        entries,
                        end: directory_end,
                    } = woff2_entries(bytes, table_count, WOFF2_HEADER_SIZE, 0, Vec::new())?;
                    let compressed = crate::knave_grid::font::tables::present(
                        usize::try_from(directory_end)
                            .ok()
                            .zip(usize::try_from(compressed_size).ok())
                            .and_then(|(start, length)| bytes.get(start..start + length))
                            .map(<[u8]>::to_vec),
                    )?;
                    let data = {
                        let mut output = Vec::new();
                        brotli_decompressor::BrotliDecompress(&mut &compressed[..], &mut output)
                            .ok()
                            .map(|_| output)
                    }
                    .ok_or(
                        crate::knave_grid::font::tables::FontError::Malformed {
                            reason: "the WOFF2 data does not decompress".to_string(),
                        },
                    )?;
                    Ok(crate::knave_grid::font::tables::make_font_tables(
                        data, entries,
                    ))
                }
            }

            fn woff2_entries(
                bytes: &Vec<u8>,
                mut remaining: i64,
                mut position: i64,
                mut offset: i64,
                mut entries: Vec<crate::knave_grid::font::tables::TableEntry>,
            ) -> Result<Woff2Directory, crate::knave_grid::font::tables::FontError> {
                loop {
                    if remaining == 0 {
                        return Ok(make_woff2_directory(entries, position));
                    } else {
                        let flags: i64 = crate::knave_grid::font::tables::present(
                            usize::try_from(position)
                                .ok()
                                .and_then(|start| bytes.get(start))
                                .map(|byte| i64::from(*byte)),
                        )?;
                        let tag_index: i64 = flags % 64;
                        let is_explicit_tag = tag_index == 63;
                        let tag = if is_explicit_tag {
                            crate::knave_grid::font::tables::present({
                                let template_argument_0 = bytes;
                                let template_argument_1 = position + 1;
                                usize::try_from(template_argument_1)
                                    .ok()
                                    .and_then(|start| template_argument_0.get(start..start + 4))
                                    .map(|bytes| String::from_utf8_lossy(bytes).into_owned())
                            })?
                        } else {
                            known_table_tag(tag_index)
                        };
                        let length_position: i64 = if is_explicit_tag {
                            position + 5
                        } else {
                            position + 1
                        };
                        let original_length = base_128_at(bytes, length_position, 0, 0)?;
                        let transformed = is_transformed(tag.as_str(), flags / 64);
                        let stored_length = if transformed {
                            base_128_at(bytes, original_length.end, 0, 0)?
                        } else {
                            original_length
                        };
                        entries.push(crate::knave_grid::font::tables::make_table_entry(
                            tag,
                            offset,
                            stored_length.value,
                            transformed,
                        ));
                        (remaining, position, offset) = (
                            remaining - 1,
                            stored_length.end,
                            offset + stored_length.value,
                        );
                        continue;
                    }
                }
            }

            fn is_transformed(tag: &str, transform_version: i64) -> bool {
                if tag == "glyf" || tag == "loca" {
                    transform_version == 0
                } else {
                    transform_version != 0
                }
            }

            fn base_128_at(
                bytes: &Vec<u8>,
                mut position: i64,
                mut value: i64,
                mut byte_count: i64,
            ) -> Result<Base128, crate::knave_grid::font::tables::FontError> {
                loop {
                    let byte: i64 = crate::knave_grid::font::tables::present(
                        usize::try_from(position)
                            .ok()
                            .and_then(|start| bytes.get(start))
                            .map(|byte| i64::from(*byte)),
                    )?;
                    let next_value: i64 = value * 128 + byte % 128;
                    let next_position: i64 = position + 1;
                    if byte < 128 {
                        return Ok(make_base_128(next_value, next_position));
                    } else if byte_count + 1 == BASE_128_MAX_BYTES {
                        return crate::knave_grid::font::tables::malformed(
                            "a WOFF2 length is longer than five bytes",
                        );
                    } else {
                        (position, value, byte_count) = (next_position, next_value, byte_count + 1);
                        continue;
                    }
                }
            }

            fn known_table_tag(index: i64) -> String {
                (known_table_tags()[index as usize]).to_string()
            }

            fn known_table_tags() -> Vec<&'static str> {
                vec![
                    "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
                    "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern",
                    "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC",
                    "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
                    "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty",
                    "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
                    "Gloc", "Feat", "Sill",
                ]
            }
        }
    }

    pub(crate) mod output {
        pub fn write_grid(
            checked: &crate::knave_grid::check::grid::CheckedGrid,
            stylesheet_path: &str,
        ) -> Result<(), crate::knave_grid::check::problems::GridError> {
            let directory = std::path::Path::new(stylesheet_path)
                .parent()
                .map(|parent| parent.to_string_lossy().into_owned())
                .unwrap_or_default();
            written(
                directory.as_str(),
                std::fs::create_dir_all(directory.as_str()).map_err(|error| error.to_string()),
            )?;
            copy_faces(
                crate::knave_grid::css::font_face::spec_families(&checked.spec),
                stylesheet_path,
                0,
            )?;
            written(
                stylesheet_path,
                std::fs::write(
                    stylesheet_path,
                    crate::knave_grid::css::grid::grid_css(checked).as_str(),
                )
                .map_err(|error| error.to_string()),
            )
        }

        fn copy_faces(
            families: Vec<crate::knave_grid::font::family::FontFamily>,
            stylesheet_path: &str,
            mut index: usize,
        ) -> Result<(), crate::knave_grid::check::problems::GridError> {
            loop {
                if index >= families.len() {
                    return Ok(());
                } else {
                    copy_family_faces(&families[index], stylesheet_path, 0)?;
                    index += 1;
                    continue;
                }
            }
        }

        fn copy_family_faces(
            family: &crate::knave_grid::font::family::FontFamily,
            stylesheet_path: &str,
            mut index: usize,
        ) -> Result<(), crate::knave_grid::check::problems::GridError> {
            loop {
                if index >= family.faces.len() {
                    return Ok(());
                } else {
                    let face = &family.faces[index];
                    let target = std::path::Path::new(stylesheet_path)
                        .with_file_name(face.file_name.as_str())
                        .to_string_lossy()
                        .into_owned();
                    written(
                        target.as_str(),
                        std::fs::copy(face.path.as_str(), target.as_str())
                            .map(drop)
                            .map_err(|error| error.to_string()),
                    )?;
                    index += 1;
                    continue;
                }
            }
        }

        fn written(
            path: &str,
            outcome: Result<(), String>,
        ) -> Result<(), crate::knave_grid::check::problems::GridError> {
            outcome.map_err(|reason: String| {
                crate::knave_grid::check::problems::GridError::Unwritable {
                    path: path.to_string(),
                    reason: reason,
                }
            })
        }
    }

    pub(crate) mod overlay {
        pub const OVERLAY_CSS: &str = ":root.grid-overlay body,\n:root.grid-guides body {\n  position: relative;\n}\n\n:root.grid-overlay body::after,\n:root.grid-guides body::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  z-index: 2147483647;\n  width: min(100% - 2 * var(--_grid-margin), var(--_grid-grid-width));\n  margin-inline: auto;\n  pointer-events: none;\n}\n\n@supports (width: round(down, 1px, 1px)) {\n  :root.grid-overlay body::after,\n  :root.grid-guides body::before {\n    width: min(round(down, 100% - 2 * var(--_grid-margin), var(--leading)), var(--_grid-grid-width));\n  }\n}\n\n:root.grid-overlay body::after {\n  box-shadow: inset 0 -1px rgb(255 64 160 / 0.6);\n  background:\n    linear-gradient(to bottom, transparent 0 var(--_grid-baseline-offset), rgb(255 64 160 / 0.6) var(--_grid-baseline-offset) calc(var(--_grid-baseline-offset) + 1px), transparent calc(var(--_grid-baseline-offset) + 1px)) 0 calc(-1 * var(--_grid-baseline-offset)) / 100% var(--leading) repeat-y,\n    linear-gradient(to right, rgb(64 160 255 / 0.15) 0 calc(100% - var(--gutter)), transparent calc(100% - var(--gutter))) 0 0 / calc((100% + var(--gutter)) / var(--columns)) 100% repeat-x;\n}\n\n:root.grid-guides body::before {\n  background: linear-gradient(to bottom, transparent 0 var(--_grid-cap-top), rgb(255 190 60 / 0.35) var(--_grid-cap-top) calc(var(--_grid-cap-top) + 1px), transparent calc(var(--_grid-cap-top) + 1px) var(--_grid-descender-bottom), rgb(255 190 60 / 0.35) var(--_grid-descender-bottom) calc(var(--_grid-descender-bottom) + 1px), transparent calc(var(--_grid-descender-bottom) + 1px)) 0 calc(-1 * var(--_grid-baseline-offset)) / 100% var(--leading) repeat-y;\n}\n\n:root.grid-overlay .type-area {\n  background: linear-gradient(to bottom, transparent 0 var(--_grid-cap-top), rgb(255 255 255 / 0.08) var(--_grid-cap-top) calc(var(--field) - var(--leading) + var(--_grid-descender-bottom)), transparent calc(var(--field) - var(--leading) + var(--_grid-descender-bottom))) 0 0 / 100% var(--field-pitch) repeat-y content-box;\n}\n";
    }

    pub(crate) mod spec {

        pub(crate) mod body_type {
            #[derive(Clone, PartialEq)]
            pub struct BodyType {
                pub size: f64,
                pub line_height: f64,
                pub font_family: crate::knave_grid::font::family::FontFamily,
                pub weight: String,
            }

            pub fn body_weight(r#type: &BodyType) -> i64 {
                crate::knave_grid::font::weight::weight_number(r#type.weight.as_str())
                    .unwrap_or(REGULAR_WEIGHT)
            }

            const REGULAR_WEIGHT: i64 = 400;

            pub fn body_metrics(
                r#type: &BodyType,
            ) -> &crate::knave_grid::font::metrics::FontMetrics {
                crate::knave_grid::font::family::family_metrics(
                    &r#type.font_family,
                    body_weight(r#type),
                )
            }

            pub fn leading_px(r#type: &BodyType) -> f64 {
                r#type.size * r#type.line_height
            }

            pub fn baseline_offset_px(r#type: &BodyType) -> f64 {
                crate::knave_grid::spec::line_box::baseline_in_line_px(
                    body_metrics(r#type),
                    r#type.size,
                    leading_px(r#type),
                )
            }

            pub fn ch_px(r#type: &BodyType) -> f64 {
                let metrics = body_metrics(r#type);
                r#type.size * (metrics.zero_width.unwrap_or(metrics.units_per_em) as f64)
                    / (metrics.units_per_em as f64)
            }
        }

        pub(crate) mod grid_spec {
            #[derive(Clone, PartialEq)]
            pub struct GridSpec {
                pub body_type: crate::knave_grid::spec::body_type::BodyType,
                pub type_areas: Vec<crate::knave_grid::spec::type_area::TypeArea>,
                pub type_styles: Vec<crate::knave_grid::spec::type_style::TypeStyle>,
            }
        }

        pub(crate) mod hanging {
            pub fn hanging_line(
                metrics: &crate::knave_grid::font::metrics::FontMetrics,
                size: f64,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> i64 {
                let cap_below_body_cap = cap_height_px(metrics, size)
                    - cap_height_px(
                        crate::knave_grid::spec::body_type::body_metrics(body),
                        body.size,
                    );
                1 + ((cap_below_body_cap / crate::knave_grid::spec::body_type::leading_px(body))
                    .ceil()
                    .max(0.0) as i64)
            }

            fn cap_height_px(
                metrics: &crate::knave_grid::font::metrics::FontMetrics,
                size: f64,
            ) -> f64 {
                size * (metrics.cap_height as f64) / (metrics.units_per_em as f64)
            }
        }

        pub(crate) mod layout {
            const MARGIN_COUNT: i64 = 2;

            #[derive(Clone, PartialEq)]
            pub struct Layout {
                pub type_area: crate::knave_grid::spec::type_area::TypeArea,
                pub min_width_em: f64,
                pub is_narrowest: bool,
            }

            fn make_layout(
                type_area: crate::knave_grid::spec::type_area::TypeArea,
                min_width_em_2: f64,
                is_narrowest: bool,
            ) -> Layout {
                Layout {
                    type_area,
                    min_width_em: min_width_em_2,
                    is_narrowest,
                }
            }

            pub fn layouts(spec: &crate::knave_grid::spec::grid_spec::GridSpec) -> Vec<Layout> {
                spec.type_areas
                    .iter()
                    .enumerate()
                    .map(
                        |entry: (usize, &crate::knave_grid::spec::type_area::TypeArea)| {
                            let (index, type_area) = entry;
                            make_layout(
                                type_area.clone(),
                                min_width_em(&spec.body_type, type_area),
                                index == 0,
                            )
                        },
                    )
                    .collect::<Vec<_>>()
            }

            fn min_width_em(
                body: &crate::knave_grid::spec::body_type::BodyType,
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
            ) -> f64 {
                let width_with_margins: i64 = type_area.width + MARGIN_COUNT * type_area.margin;
                (width_with_margins as f64) * crate::knave_grid::spec::body_type::leading_px(body)
                    / crate::knave_grid::browser::DEFAULT_FONT_SIZE_PX
            }

            pub fn layout_label(layout: &Layout) -> String {
                let name = format!("the {} type area", layout.type_area.name);
                if layout.is_narrowest {
                    name
                } else {
                    format!("{}, from {}em", name, layout.min_width_em)
                }
            }
        }

        pub(crate) mod line_box {
            pub fn baseline_in_line_px(
                metrics: &crate::knave_grid::font::metrics::FontMetrics,
                font_size_px: f64,
                line_height_px: f64,
            ) -> f64 {
                let ascent = whole_pixels(metrics, font_size_px, metrics.ascent);
                let half_leading =
                    ((line_height_px - glyph_height_px(metrics, font_size_px)) / 2.0).floor();
                half_leading + ascent
            }

            pub fn glyph_height_px(
                metrics: &crate::knave_grid::font::metrics::FontMetrics,
                font_size_px: f64,
            ) -> f64 {
                whole_pixels(metrics, font_size_px, metrics.ascent)
                    + whole_pixels(metrics, font_size_px, metrics.descent)
            }

            fn whole_pixels(
                metrics: &crate::knave_grid::font::metrics::FontMetrics,
                font_size_px: f64,
                font_units: i64,
            ) -> f64 {
                (font_size_px * (font_units as f64) / (metrics.units_per_em as f64)).round()
            }
        }

        pub(crate) mod measure {
            const TARGET_CHARACTERS: f64 = 66.0;

            pub fn measure_columns(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> i64 {
                match type_area.measure_columns {
                    Some(columns) => columns,
                    None => widest_span_within(type_area, body, type_area.column_count),
                }
            }

            fn widest_span_within(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
                body: &crate::knave_grid::spec::body_type::BodyType,
                mut columns: i64,
            ) -> i64 {
                loop {
                    if columns <= 1 {
                        return 1;
                    } else if span_px(type_area, body, columns)
                        <= TARGET_CHARACTERS * crate::knave_grid::spec::body_type::ch_px(body)
                    {
                        return columns;
                    } else {
                        columns -= 1;
                        continue;
                    }
                }
            }

            pub fn measure_characters(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> f64 {
                span_px(type_area, body, measure_columns(type_area, body))
                    / crate::knave_grid::spec::body_type::ch_px(body)
            }

            fn span_px(
                type_area: &crate::knave_grid::spec::type_area::TypeArea,
                body: &crate::knave_grid::spec::body_type::BodyType,
                columns: i64,
            ) -> f64 {
                (crate::knave_grid::spec::type_area::span_width(type_area, columns) as f64)
                    * crate::knave_grid::spec::body_type::leading_px(body)
            }
        }

        pub(crate) mod type_area {
            #[derive(Clone, PartialEq, Eq, Hash)]
            pub struct TypeArea {
                pub name: String,
                pub width: i64,
                pub gutter: i64,
                pub column_count: i64,
                pub margin: i64,
                pub head: i64,
                pub foot: i64,
                pub measure_columns: Option<i64>,
                pub field_lines: Option<i64>,
                pub field_gap: i64,
            }

            pub fn span_width(type_area: &TypeArea, column_count: i64) -> i64 {
                column_count * track_width(type_area) - type_area.gutter
            }

            fn track_width(type_area: &TypeArea) -> i64 {
                width_with_gutter(type_area) / type_area.column_count
            }

            pub fn is_fits(type_area: &TypeArea) -> bool {
                is_fits_column_count(type_area, type_area.column_count)
            }

            pub fn fitting_column_counts(type_area: &TypeArea) -> Vec<i64> {
                (1..(width_with_gutter(type_area) + 1))
                    .filter(|column_count: &i64| is_fits_column_count(type_area, *column_count))
                    .collect::<Vec<_>>()
            }

            fn is_fits_column_count(type_area: &TypeArea, column_count: i64) -> bool {
                column_count > 0
                    && is_divides(column_count, width_with_gutter(type_area))
                    && width_with_gutter(type_area) / column_count > type_area.gutter
            }

            fn is_divides(divisor: i64, total: i64) -> bool {
                total % divisor == 0
            }

            fn width_with_gutter(type_area: &TypeArea) -> i64 {
                type_area.width + type_area.gutter
            }
        }

        pub(crate) mod type_style {
            #[derive(Clone, PartialEq)]
            pub struct TypeStyle {
                pub name: String,
                pub lines: i64,
                pub size: Option<f64>,
                pub font_family: Option<crate::knave_grid::font::family::FontFamily>,
                pub weight: Option<String>,
                pub baseline_line: Option<i64>,
                pub selector: Option<String>,
            }

            pub fn style_weight(
                style: &TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> i64 {
                match &style.weight {
                    Some(name) => crate::knave_grid::font::weight::weight_number(name.as_str())
                        .unwrap_or(crate::knave_grid::spec::body_type::body_weight(body)),
                    None => crate::knave_grid::spec::body_type::body_weight(body),
                }
            }

            pub fn style_font_size_px(
                style: &TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> f64 {
                match style.size {
                    Some(size) => size,
                    None => (style.lines as f64) * body.size,
                }
            }

            pub fn style_line_height_px(
                style: &TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> f64 {
                (style.lines as f64) * crate::knave_grid::spec::body_type::leading_px(body)
            }

            pub fn style_shift_px(
                style: &TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> f64 {
                let baseline = crate::knave_grid::spec::line_box::baseline_in_line_px(
                    &style_metrics(style, body),
                    style_font_size_px(style, body),
                    style_line_height_px(style, body),
                );
                grid_baseline_px(style, body) - baseline
            }

            pub fn style_baseline_line(
                style: &TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> i64 {
                match style.baseline_line {
                    Some(line) => line,
                    None => crate::knave_grid::spec::hanging::hanging_line(
                        &style_metrics(style, body),
                        style_font_size_px(style, body),
                        body,
                    ),
                }
            }

            fn grid_baseline_px(
                style: &TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> f64 {
                ((style_baseline_line(style, body) - 1) as f64)
                    * crate::knave_grid::spec::body_type::leading_px(body)
                    + crate::knave_grid::spec::body_type::baseline_offset_px(body)
            }

            pub fn style_metrics(
                style: &TypeStyle,
                body: &crate::knave_grid::spec::body_type::BodyType,
            ) -> crate::knave_grid::font::metrics::FontMetrics {
                match &style.font_family {
                    Some(family) => *crate::knave_grid::font::family::family_metrics(
                        family,
                        style_weight(style, body),
                    ),
                    None => *crate::knave_grid::font::family::family_metrics(
                        &body.font_family,
                        style_weight(style, body),
                    ),
                }
            }
        }
    }
}

mod rt {
    #[cfg(unix)]
    pub fn restore_default_sigpipe() {
        const SIGPIPE: i32 = 13;
        const DEFAULT_HANDLER: usize = 0;
        unsafe extern "C" {
            fn signal(signal: i32, handler: usize) -> usize;
        }
        unsafe {
            signal(SIGPIPE, DEFAULT_HANDLER);
        }
    }

    #[cfg(not(unix))]
    pub fn restore_default_sigpipe() {}

    use std::fmt::{Display, Formatter, Result, Write};

    pub trait Show {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result;
    }

    pub struct Shown<'v, T: Show + ?Sized>(pub &'v T);

    impl<T: Show + ?Sized> Display for Shown<'_, T> {
        fn fmt(&self, out: &mut Formatter<'_>) -> Result {
            self.0.write_form(out)
        }
    }

    pub struct Record<'r, 'f> {
        out: &'r mut Formatter<'f>,
        written: Result,
    }

    impl<'r, 'f> Record<'r, 'f> {
        pub fn open(out: &'r mut Formatter<'f>, head: &str) -> Self {
            let written = write!(out, "({head}");
            Record { out, written }
        }

        pub fn part<T: Show + ?Sized>(self, value: &T) -> Self {
            self.write(|out| {
                out.write_char(' ')?;
                value.write_form(out)
            })
        }

        pub fn text(self, written: &str) -> Self {
            self.write(|out| write!(out, " {written}"))
        }

        pub fn close(self) -> Result {
            self.written?;
            self.out.write_char(')')
        }

        fn write(mut self, part: impl FnOnce(&mut Formatter<'f>) -> Result) -> Self {
            self.written = self.written.and_then(|()| part(self.out));
            self
        }
    }

    struct Quoted<'t>(&'t str);

    impl Display for Quoted<'_> {
        fn fmt(&self, out: &mut Formatter<'_>) -> Result {
            out.write_char('"')?;
            for character in self.0.chars() {
                match character {
                    '"' => out.write_str("\\\"")?,
                    '\\' => out.write_str("\\\\")?,
                    '\n' => out.write_str("\\n")?,
                    '\r' => out.write_str("\\r")?,
                    '\t' => out.write_str("\\t")?,
                    '\0' => out.write_str("\\0")?,
                    control if control.is_control() => write!(out, "\\u{{{:x}}}", control as u32)?,
                    printable => out.write_char(printable)?,
                }
            }
            out.write_char('"')
        }
    }

    macro_rules! shown_as_display {
        ($($shown:ty),*) => {
            $(
                impl Show for $shown {
                    fn write_form(&self, out: &mut Formatter<'_>) -> Result {
                        write!(out, "{self}")
                    }
                }
            )*
        };
    }

    shown_as_display!(
        bool, i8, i16, i32, i64, i128, isize, u8, u16, u32, u64, u128, usize
    );

    macro_rules! shown_as_float {
        ($($shown:ty),*) => {
            $(
                impl Show for $shown {
                    fn write_form(&self, out: &mut Formatter<'_>) -> Result {
                        if self.is_nan() {
                            out.write_str("(/ 0.0 0.0)")
                        } else if self.is_infinite() && self.is_sign_positive() {
                            out.write_str("(/ 1.0 0.0)")
                        } else if self.is_infinite() {
                            out.write_str("(/ -1.0 0.0)")
                        } else {
                            write!(out, "{self:?}")
                        }
                    }
                }
            )*
        };
    }

    shown_as_float!(f32, f64);

    macro_rules! shown_as_message {
        ($($shown:ty => $head:literal),*) => {
            $(
                impl Show for $shown {
                    fn write_form(&self, out: &mut Formatter<'_>) -> Result {
                        Record::open(out, $head).part(self.to_string().as_str()).close()
                    }
                }
            )*
        };
    }

    shown_as_message!(
        std::io::Error => "io-error",
        std::str::ParseBoolError => "parse-bool-error",
        std::char::ParseCharError => "parse-char-error",
        std::num::ParseIntError => "parse-int-error",
        std::num::ParseFloatError => "parse-float-error"
    );

    impl Show for std::convert::Infallible {
        fn write_form(&self, _: &mut Formatter<'_>) -> Result {
            match *self {}
        }
    }

    impl Show for char {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            let mut text = [0; 4];
            Record::open(out, "char")
                .part(&*self.encode_utf8(&mut text))
                .close()
        }
    }

    impl Show for str {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            write!(out, "{}", Quoted(self))
        }
    }

    impl Show for String {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            self.as_str().write_form(out)
        }
    }

    impl Show for () {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            out.write_str("(do)")
        }
    }

    impl<T: Show + ?Sized> Show for &T {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            T::write_form(self, out)
        }
    }

    impl<T: Show + ?Sized> Show for Box<T> {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            Record::open(out, "box").part(&**self).close()
        }
    }

    impl<T: Show> Show for [T] {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            self.iter()
                .fold(Record::open(out, "vec"), Record::part)
                .close()
        }
    }

    impl<T: Show> Show for Vec<T> {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            self.as_slice().write_form(out)
        }
    }

    impl<T: Show> Show for Option<T> {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            match self {
                Some(value) => Record::open(out, "some").part(value).close(),
                None => out.write_str("none"),
            }
        }
    }

    impl<T: Show, E: Show> Show for std::result::Result<T, E> {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            match self {
                Ok(value) => Record::open(out, "ok").part(value).close(),
                Err(error) => Record::open(out, "err").part(error).close(),
            }
        }
    }

    impl<A: Show, B: Show> Show for (A, B) {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            Record::open(out, "pair")
                .part(&self.0)
                .part(&self.1)
                .close()
        }
    }

    impl<K: Show, V: Show> Show for std::collections::BTreeMap<K, V> {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            self.iter()
                .fold(Record::open(out, "sorted-map"), |record, (key, value)| {
                    record.part(key).part(value)
                })
                .close()
        }
    }

    impl<K: Show, V: Show, S> Show for std::collections::HashMap<K, V, S> {
        fn write_form(&self, out: &mut Formatter<'_>) -> Result {
            let mut entries: Vec<(String, &V)> = self
                .iter()
                .map(|(key, value)| (Shown(key).to_string(), value))
                .collect();
            entries.sort_by(|(left, _), (right, _)| left.cmp(right));
            entries
                .iter()
                .fold(Record::open(out, "hash-map"), |record, (key, value)| {
                    record.text(key).part(*value)
                })
                .close()
        }
    }
}
