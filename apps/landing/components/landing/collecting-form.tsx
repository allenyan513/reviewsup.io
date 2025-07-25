import Link from 'next/link';
import { cn } from '@reviewsup/ui/lib/utils';
import { buttonVariants } from '@reviewsup/ui/button';
import { BsPhone } from 'react-icons/bs';

export function CollectingForm(props: {
  title: string;
  subtitle: React.ReactNode;
  formId: string;
  buttonText: string;
}) {
  const { title, subtitle, formId, buttonText } = props;

  return (
    <section className="flex flex-col items-center w-full">
      <h2 className="w-full text-center text-4xl pb-4 font-semibold">
        {title}
      </h2>
      <h3 className="text-muted-foreground sm:text-lg text-center pb-8">
        {subtitle}
      </h3>
      <Link
        href={`${process.env.NEXT_PUBLIC_APP_URL}/forms/${formId}`}
        target={'_blank'}
        className={cn(
          buttonVariants({ size: 'lg' }),
          'bg-red-400 hover:bg-red-500 rounded-md h-14 text-white font-semibold',
        )}
      >
        {buttonText}
      </Link>

      <div className="relative w-full h-[450px] mt-8 rounded-md overflow-hidden border border-gray-200">
        <iframe
          className="w-full h-full pointer-events-none"
          src={`${process.env.NEXT_PUBLIC_APP_URL}/forms/${formId}`}
          title="Collecting Form"
        />
        {/*从下往上 白色蒙层 一半*/}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
