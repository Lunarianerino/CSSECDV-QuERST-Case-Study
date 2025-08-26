"use client"
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {KeenSliderPlugin, useKeenSlider} from "keen-slider/react";
import {SvtInfo, TutorResponsibilities} from "@/components/landing/svtinfo";
import {CircleArrowUpIcon} from "lucide-react";
import {useEffect, useState} from "react";

const WheelControls: KeenSliderPlugin = (slider) => {
    let touchTimeout: ReturnType<typeof setTimeout>
    let position: {
        x: number
        y: number
    }
    let wheelActive: boolean

    function dispatch(e: WheelEvent, name: string) {
        position.x -= e.deltaX
        position.y -= e.deltaY
        slider.container.dispatchEvent(
            new CustomEvent(name, {
                detail: {
                    x: position.x,
                    y: position.y,
                },
            })
        )
    }

    function wheelStart(e: WheelEvent) {
        position = {
            x: e.pageX,
            y: e.pageY,
        }
        dispatch(e, "ksDragStart")
    }

    function wheel(e: WheelEvent) {
        dispatch(e, "ksDrag")
    }

    function wheelEnd(e: WheelEvent) {
        dispatch(e, "ksDragEnd")
    }

    function eventWheel(e: WheelEvent) {
        e.preventDefault()
        if (!wheelActive) {
            wheelStart(e)
            wheelActive = true
        }
        wheel(e)
        clearTimeout(touchTimeout)
        touchTimeout = setTimeout(() => {
            wheelActive = false
            wheelEnd(e)
        }, 50)
    }

    slider.on("created", () => {
        slider.container.addEventListener("wheel", eventWheel, {
            passive: false,
        })
    })
};

export function QuerstCarousel() {
    const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
        {
            loop: false,
            rubberband: false,
            vertical: true,
        },
        [WheelControls]
    );

    const [isLastSlide, setIsLastSlide] = useState<boolean>(false);

    useEffect(() => {
        instanceRef.current?.on('slideChanged', () => {
            setIsLastSlide((instanceRef.current?.slides.length || 0) - 1 === (instanceRef.current?.track.details.abs || 0));
        });
    }, []);

    return (<div ref={sliderRef} className="keen-slider max-h-screen">
        <div className="keen-slider__slide max-h-screen text-center flex flex-col">
            <img src="/logo.svg" className="self-center h-96" alt="QuERST logo"/>
            <h1 className="text-3xl font-extrabold"><span className="text-hero">Qu</span>ality <span className="text-hero">E</span>ducation in</h1>
            <h1 className="text-3xl font-extrabold"><span className="text-hero">R</span>esource-challenged <span className="text-hero">S</span>chools</h1>
            <h3 className="text-xl font-extrabold">with the help of</h3>
            <h1 className="text-3xl font-extrabold"><span className="text-hero">T</span>echnology</h1>
            <h1 className="text-xl mt-2"><CircleArrowUpIcon className="inline" /> Scroll to learn more</h1>
        </div>
        <div className="keen-slider__slide max-h-screen"><SvtInfo /></div>
        <div className="keen-slider__slide max-h-screen"><TutorResponsibilities /></div>
        <div className="absolute top-5/12 md:top-10/12 flex gap-2">
            <Link href="#preregister" className="md:collapse">
                <Button size="lg">Pre-register</Button>
            </Link>
            {!isLastSlide && <Button size="lg" onClick={() => { instanceRef.current?.next(); }}>More</Button>}
        </div>
    </div>)
}